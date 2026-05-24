import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { useAppTheme } from '@/theme/useAppTheme';

type QuickActionCardProps = {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
};

export const QuickActionCard = ({ title, description, icon, onPress }: QuickActionCardProps) => {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.88 : 1,
          borderRadius: theme.radius.md
        }
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.surfaceAlt
          }
        ]}
      >
        <AppText style={styles.icon}>{icon}</AppText>
      </View>

      <View style={styles.content}>
        <AppText style={styles.title}>{title}</AppText>
        <AppText muted style={styles.description}>
          {description}
        </AppText>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconWrap: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    fontSize: 18
  },
  content: {
    flex: 1,
    gap: 2
  },
  title: {
    fontSize: 16,
    fontWeight: '700'
  },
  description: {
    fontSize: 12,
    lineHeight: 16
  }
});
