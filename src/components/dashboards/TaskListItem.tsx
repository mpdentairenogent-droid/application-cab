import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Card } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { TASK_PRIORITY_LABEL, TASK_PRIORITY_TONE, TASK_STATUS_LABEL, TASK_STATUS_TONE } from '@/constants/taskLabels';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatRelativeDay } from '@/lib/format';
import type { TaskRow } from '@/types/database';

interface TaskListItemProps {
  task: TaskRow;
  onPress?: () => void;
  assigneeSummary?: string;
  showStatus?: boolean;
}

export function TaskListItem({ task, onPress, assigneeSummary, showStatus }: TaskListItemProps) {
  const theme = useAppTheme();
  const content = (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
          {task.title}
        </Text>
        <View style={styles.badges}>
          {showStatus ? <Badge label={TASK_STATUS_LABEL[task.status]} tone={TASK_STATUS_TONE[task.status]} /> : null}
          <Badge label={TASK_PRIORITY_LABEL[task.priority]} tone={TASK_PRIORITY_TONE[task.priority]} />
        </View>
      </View>
      {task.due_date || assigneeSummary ? (
        <Text style={[styles.due, { color: theme.textMuted }]} numberOfLines={1}>
          {[task.due_date ? formatRelativeDay(task.due_date) : null, assigneeSummary].filter(Boolean).join(' · ')}
        </Text>
      ) : null}
    </Card>
  );

  if (!onPress) return content;
  return <Pressable onPress={onPress}>{content}</Pressable>;
}

const styles = StyleSheet.create({
  card: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  badges: { flexDirection: 'row', gap: spacing.xs },
  title: { flex: 1, fontSize: typography.size.base, fontWeight: typography.weight.medium },
  due: { fontSize: typography.size.xs },
});
