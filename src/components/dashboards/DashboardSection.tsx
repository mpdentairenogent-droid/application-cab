import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState, LoadingState } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface DashboardSectionProps {
  title: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyLabel?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function DashboardSection({ title, isLoading, isEmpty, emptyLabel = 'Rien à signaler', action, children }: DashboardSectionProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        {action}
      </View>
      {isLoading ? (
        <Card>
          <LoadingState />
        </Card>
      ) : isEmpty ? (
        <Card>
          <EmptyState title={emptyLabel} />
        </Card>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold },
});
