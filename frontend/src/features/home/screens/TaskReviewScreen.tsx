import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import { getQuickActionById } from '@/features/home/types/home';
import type { QuickActionId } from '@/features/home/types/home';
import { useGetAgentSettingsQuery } from '@/features/workspace/api/workspaceApi';
import type { AgentPlugins } from '@/features/workspace/types/workspace';
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

const ACTION_PLUGIN_KEY_MAP: Record<QuickActionId, keyof AgentPlugins | null> = {
  call: 'smartCall',
  message: 'messageDraft',
  email: 'emailComposer',
  settings: null
};

export const TaskReviewScreen = ({ navigation, route }: TaskReviewScreenProps) => {
  const theme = useAppTheme();
  const action = getQuickActionById(route.params.actionId);
  const { data: agentSettings, isFetching: isLoadingSettings } = useGetAgentSettingsQuery();
  const [policyInitialized, setPolicyInitialized] = useState(false);

  const [selectedSafety, setSelectedSafety] = useState<string[]>(
    SAFETY_ITEMS.map((item) => item.id)
  );

  const requiredPluginKey = ACTION_PLUGIN_KEY_MAP[action.id];
  const isRequiredPluginEnabled = requiredPluginKey
    ? (agentSettings?.plugins?.[requiredPluginKey] ?? true)
    : true;

  useEffect(() => {
    if (!agentSettings || policyInitialized) {
      return;
    }

    setSelectedSafety((previous) => {
      const next = new Set(previous);

      if (agentSettings.safety.confirmSensitiveAction) {
        next.add('confirmation');
      } else {
        next.delete('confirmation');
      }

      if (agentSettings.plugins.autoSummaryLogs) {
        next.add('logging');
      } else {
        next.delete('logging');
      }

      next.add('limit');
      return Array.from(next);
    });
    setPolicyInitialized(true);
  }, [agentSettings, policyInitialized]);

  const isPlanReady = selectedSafety.length >= 2 && isRequiredPluginEnabled;

  const safetySummary = useMemo(() => {
    if (!isRequiredPluginEnabled) {
      return 'Required plugin is currently disabled. Enable it in Agent Settings.';
    }

    if (selectedSafety.length === SAFETY_ITEMS.length) {
      return 'All safety checks active.';
    }

    if (selectedSafety.length === 0) {
      return 'No safety checks active. This is not recommended.';
    }

    return `${selectedSafety.length} safety checks active.`;
  }, [isRequiredPluginEnabled, selectedSafety.length]);

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
        <AppText muted>Validate plan before execution for {action.title.toLowerCase()}.</AppText>
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
        {route.params.targetContactName ? (
          <AppText muted style={styles.promptText}>
            Target contact: {route.params.targetContactName}
          </AppText>
        ) : null}
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
        {agentSettings ? (
          <>
            <AppText muted style={styles.summaryText}>
              Daily automation limit: {agentSettings.safety.dailyAutomationLimit}
            </AppText>
            <AppText muted style={styles.summaryText}>
              Audit retention: {agentSettings.safety.auditRetentionDays} days
            </AppText>
          </>
        ) : null}
      </View>

      {!isRequiredPluginEnabled ? (
        <Button
          label="Open Agent Settings"
          variant="ghost"
          onPress={() => {
            navigation.navigate('AgentSettings');
          }}
        />
      ) : null}

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
            targetContactName: route.params.targetContactName,
            targetPhoneNumber: route.params.targetPhoneNumber
          });
        }}
        disabled={!isPlanReady}
        isLoading={isLoadingSettings}
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
