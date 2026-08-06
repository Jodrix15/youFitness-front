import { Pressable, StyleSheet, View } from 'react-native';

import { makeStyles } from '../theme';
import { Text } from './Text';

export type Segment<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  segments: readonly Segment<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ segments, value, onChange }: Props<T>) {
  const styles = useStyles();

  return (
    <View style={styles.track}>
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <Pressable
            key={s.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(s.value)}
            style={[styles.seg, active && styles.segActive]}
          >
            <Text variant="caption" weight="semibold" tone={active ? 'ink' : 'muted'}>
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      backgroundColor: t.colors.surfaceAlt,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: 3,
      gap: 3,
    },
    seg: {
      flex: 1,
      height: 34,
      borderRadius: t.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segActive: {
      backgroundColor: t.colors.accent,
    },
  }),
);
