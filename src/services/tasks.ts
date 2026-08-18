import { toISODate } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { AppRole, TaskInsert, TaskRow, TaskUpdate } from '@/types/database';

export type TaskView = 'today' | 'week' | 'overdue' | 'done';

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Tâches non terminées, échéance aujourd'hui ou dépassée — le cœur du "que dois-je faire aujourd'hui ?" (§19). */
export async function listTodayAndOverdueTasks(limitCount = 10) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .neq('status', 'done')
    .lte('due_date', toISODate(new Date()))
    .order('due_date', { ascending: true })
    .limit(limitCount);
  if (error) throw error;
  return data;
}

export async function listTasksByView(view: TaskView): Promise<TaskRow[]> {
  const today = toISODate(new Date());
  let query = supabase.from('tasks').select('*');

  switch (view) {
    case 'today':
      query = query.neq('status', 'done').eq('due_date', today);
      break;
    case 'week':
      query = query.neq('status', 'done').gte('due_date', today).lte('due_date', toISODate(addDays(new Date(), 7)));
      break;
    case 'overdue':
      query = query.neq('status', 'done').lt('due_date', today);
      break;
    case 'done':
      query = query.eq('status', 'done');
      break;
  }

  const { data, error } = await query.order('due_date', { ascending: view !== 'done' });
  if (error) throw error;
  return data;
}

export interface TaskAssigneeInfo {
  userId: string;
  firstName: string;
  lastName: string;
}

export async function listTaskAssignees(taskIds: string[]): Promise<Record<string, TaskAssigneeInfo[]>> {
  if (taskIds.length === 0) return {};
  const { data, error } = await supabase.from('task_assignments').select('task_id, user_id').in('task_id', taskIds);
  if (error) throw error;

  const userIds = [...new Set(data.map((row) => row.user_id))];
  if (userIds.length === 0) return {};

  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, first_name, last_name').in('id', userIds);
  if (profilesError) throw profilesError;
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const result: Record<string, TaskAssigneeInfo[]> = {};
  for (const row of data) {
    const profile = profileById.get(row.user_id);
    if (!profile) continue;
    result[row.task_id] ??= [];
    result[row.task_id].push({ userId: row.user_id, firstName: profile.first_name, lastName: profile.last_name });
  }
  return result;
}

export interface CreateTaskInput {
  title: string;
  description: string | null;
  priority: TaskRow['priority'];
  dueDate: string | null;
  createdBy: string;
  assignmentMode: 'person' | 'people' | 'role' | 'everyone';
  responsibleId: string | null;
  assigneeIds: string[];
  assignedRole: AppRole | null;
}

export async function createTask(input: CreateTaskInput) {
  const payload: TaskInsert = {
    title: input.title,
    description: input.description,
    notes: null,
    created_by: input.createdBy,
    responsible_id: input.assignmentMode === 'person' ? input.responsibleId : null,
    assigned_role: input.assignmentMode === 'role' ? input.assignedRole : null,
    assigned_to_all: input.assignmentMode === 'everyone',
    due_date: input.dueDate,
    priority: input.priority,
    status: 'todo',
  };

  const { data, error } = await supabase.from('tasks').insert(payload).select('id').single();
  if (error) throw error;

  if (input.assignmentMode === 'people' && input.assigneeIds.length > 0) {
    const { error: assignError } = await supabase.from('task_assignments').insert(input.assigneeIds.map((userId) => ({ task_id: data.id, user_id: userId })));
    if (assignError) throw assignError;
  }

  return data.id;
}

export interface UpdateTaskInput extends CreateTaskInput {
  status: TaskRow['status'];
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  const payload: TaskUpdate = {
    title: input.title,
    description: input.description,
    responsible_id: input.assignmentMode === 'person' ? input.responsibleId : null,
    assigned_role: input.assignmentMode === 'role' ? input.assignedRole : null,
    assigned_to_all: input.assignmentMode === 'everyone',
    due_date: input.dueDate,
    priority: input.priority,
    status: input.status,
  };

  const { error } = await supabase.from('tasks').update(payload).eq('id', id);
  if (error) throw error;

  const { error: clearError } = await supabase.from('task_assignments').delete().eq('task_id', id);
  if (clearError) throw clearError;

  if (input.assignmentMode === 'people' && input.assigneeIds.length > 0) {
    const { error: assignError } = await supabase.from('task_assignments').insert(input.assigneeIds.map((userId) => ({ task_id: id, user_id: userId })));
    if (assignError) throw assignError;
  }
}

export async function setTaskStatus(id: string, status: TaskRow['status']) {
  const { error } = await supabase.from('tasks').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}
