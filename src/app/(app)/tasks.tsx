import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChipSelect, EmptyState, LoadingState, ScreenContainer } from '@/components/ui';
import { TaskListItem } from '@/components/dashboards/TaskListItem';
import { TaskFormSheet } from '@/components/tasks/TaskFormSheet';
import { ROLE_LABELS } from '@/constants/permissions';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { listTaskAssignees, listTasksByView, type TaskView } from '@/services/tasks';
import { listActiveTeamMembers } from '@/services/team';
import type { TaskRow } from '@/types/database';

const VIEW_OPTIONS = [
  { value: 'today' as const, label: "Aujourd'hui" },
  { value: 'week' as const, label: 'Cette semaine' },
  { value: 'overdue' as const, label: 'En retard' },
  { value: 'done' as const, label: 'Terminées' },
];

export default function TasksScreen() {
  const theme = useAppTheme();
  const [view, setView] = useState<TaskView>('today');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRow | undefined>(undefined);
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({ queryKey: ['tasks', view], queryFn: () => listTasksByView(view) });
  const taskIds = useMemo(() => tasksQuery.data?.map((t) => t.id) ?? [], [tasksQuery.data]);
  const assigneesQuery = useQuery({
    queryKey: ['task-assignees', taskIds],
    queryFn: () => listTaskAssignees(taskIds),
    enabled: taskIds.length > 0,
  });
  const teamQuery = useQuery({ queryKey: ['team-members'], queryFn: listActiveTeamMembers });
  const memberNameById = useMemo(
    () => new Map((teamQuery.data ?? []).map((m) => [m.id, `${m.first_name} ${m.last_name}`])),
    [teamQuery.data]
  );

  function assigneeSummary(task: TaskRow): string | undefined {
    if (task.assigned_to_all) return "Toute l'équipe";
    if (task.assigned_role) return ROLE_LABELS[task.assigned_role];
    if (task.responsible_id) return memberNameById.get(task.responsible_id);
    const people = assigneesQuery.data?.[task.id];
    if (people?.length) return people.map((p) => `${p.firstName} ${p.lastName}`).join(', ');
    return undefined;
  }

  function openCreate() {
    setEditingTask(undefined);
    setFormOpen(true);
  }

  function openEdit(task: TaskRow) {
    setEditingTask(task);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['task-assignees'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-tasks-today'] });
  }

  const existingAssigneeIds = editingTask ? (assigneesQuery.data?.[editingTask.id] ?? []).map((a) => a.userId) : undefined;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Tâches</Text>
        <Pressable
          onPress={openCreate}
          accessibilityRole="button"
          accessibilityLabel="Nouvelle tâche"
          style={[styles.addButton, { backgroundColor: theme.primary }]}>
          <Ionicons name="add" size={24} color={theme.textOnPrimary} />
        </Pressable>
      </View>

      <ChipSelect label="Vue" options={VIEW_OPTIONS} value={view} onChange={setView} />

      {tasksQuery.isLoading ? (
        <LoadingState />
      ) : tasksQuery.data?.length === 0 ? (
        <EmptyState title="Aucune tâche" description="Tout est à jour pour cette vue." />
      ) : (
        <View style={styles.list}>
          {tasksQuery.data?.map((task) => (
            <TaskListItem key={task.id} task={task} showStatus onPress={() => openEdit(task)} assigneeSummary={assigneeSummary(task)} />
          ))}
        </View>
      )}

      <TaskFormSheet
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        task={editingTask}
        existingAssigneeIds={existingAssigneeIds}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.size.xl2, fontWeight: typography.weight.bold },
  addButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  list: { gap: spacing.sm },
});
