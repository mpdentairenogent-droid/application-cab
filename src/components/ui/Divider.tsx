import { StyleSheet, View } from 'react-native';

import { spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export function Divider({ spacing: verticalSpacing = spacing.md }: { spacing?: number }) {
  const theme = useAppTheme();
  return <View style={[styles.line, { backgroundColor: theme.border, marginVertical: verticalSpacing }]} />;
}

const styles = StyleSheet.create({
  line: { height: StyleSheet.hairlineWidth, width: '100%' },
});
