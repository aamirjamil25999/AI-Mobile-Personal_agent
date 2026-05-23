import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import { getQuickActionById } from '@/features/home/types/home';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useAppTheme } from '@/theme/useAppTheme';

type TaskReviewScreenProps = NativeStackScreenProps<RootStackParamList, 'TaskReview'>;

type SafetyItem = {
  id: string;
  label: string;
};

const SAFETY_ITEMS: SafetyItem[] = [
  {
    id: 'confirmation',
    label: 'Ask confirmation before any sensitive action'
  },
  {
    id: 'limit',
    label: 'Limit action to selected task only'
  },
  {
    id: 'logging',
    label: 'Store execution log for audit history'
  }
];

export const TaskReviewScreen = ({ navigation, route }: TaskReviewScreenProps) => {
  const theme = useAppTheme();
  const action = getQuickActionById(route.params.actionId);

  const [selectedSafety, setSelectedSafety] = useState<string[]>(
    SAFETY_ITEMS.map((item) => item.id)
  );

  const isPlanReady = selectedSafety.length >= 2;

  const safetySummary = useMemo(() => {
    if (selectedSafety.length === SAFETY_ITEMS.length) {
      return 'All safety checks active.';
    }

    if (selectedSafety.length === 0) {
      return 'No safety checks active. This is not recommended.';
    }

    return `${selectedSafety.length} safety checks active.`;
  }, [selectedSafety]);

  const toggleSafety = (itemId: string) => {
    setSelectedSafety((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      }

      return [...prev, itemId];
    });
  };

  return (
    <ScreenContainer contentStyle={styles.container}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg
          }
        ]}
      >
        <AppText style={styles.title}>Task Review</AppText>
        <AppText muted>
          Validate plan before execution for {action.title.toLowerCase()}.
        </AppText>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md
          }
        ]}
      >
        <AppText style={styles.blockTitle}>Generated Prompt</AppText>
        <AppText muted style={styles.promptText}>
          {route.params.prompt}
        </AppText>
        {route.params.targetPhoneNumber ? (
          <AppText muted style={styles.promptText}>
            Target number: {route.params.targetPhoneNumber}
          </AppText>
        ) : null}
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md
          }
        ]}
      >
        <AppText style={styles.blockTitle}>Safety Checks</AppText>

        <View style={styles.safetyList}>
          {SAFETY_ITEMS.map((item) => {
            const isActive = selectedSafety.includes(item.id);

            return (
              <Pressable
                key={item.id}
                onPress={() => toggleSafety(item.id)}
                style={[
                  styles.safetyRow,
                  {
                    borderColor: isActive ? theme.colors.primary : theme.colors.border,
                    backgroundColor: isActive ? theme.colors.surfaceAlt : theme.colors.surface
                  }
                ]}
              >
                <AppText style={styles.checkbox}>{isActive ? '[x]' : '[ ]'}</AppText>
                <AppText muted={!isActive}>{item.label}</AppText>
              </Pressable>
            );
          })}
        </View>

        <AppText muted style={styles.summaryText}>
          {safetySummary}
        </AppText>
      </View>

      <Button
        label="Approve And Continue"
        onPress={() => {
          if (!isPlanReady) {
            return;
          }

          navigation.navigate('ExecutionStatus', {
            actionId: action.id,
            prompt: route.params.prompt,
            safetyCount: selectedSafety.length,
            targetPhoneNumber: route.params.targetPhoneNumber
          });
        }}
        disabled={!isPlanReady}
      />

      <Button label="Back" variant="secondary" onPress={() => navigation.goBack()} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14
  },
  card: {
    borderWidth: 1,
    padding: 14,
    gap: 8
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800'
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  promptText: {
    fontSize: 13,
    lineHeight: 19
  },
  safetyList: {
    gap: 8,
    marginTop: 2
  },
  safetyRow: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  checkbox: {
    width: 30,
    fontWeight: '700'
  },
  summaryText: {
    marginTop: 4,
    fontSize: 12
  }
});
