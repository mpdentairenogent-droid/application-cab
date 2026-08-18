import { Link, type Href } from 'expo-router';
import { StyleSheet } from 'react-native';

import { typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export function SectionLink({ href, label = 'Voir tout' }: { href: Href; label?: string }) {
  const theme = useAppTheme();
  return (
    <Link href={href} style={[styles.link, { color: theme.secondary }]}>
      {label}
    </Link>
  );
}

const styles = StyleSheet.create({
  link: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
});
