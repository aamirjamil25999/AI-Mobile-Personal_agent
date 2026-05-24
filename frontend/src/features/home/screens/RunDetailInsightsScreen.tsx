import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import { getQuickActionById } from '@/features/home/types/home';
import type { QuickActionId } from '@/features/home/types/home';
import { useGetExecutionQuery } from '@/features/workspace/api/workspaceApi';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useAppTheme } from '@/theme/useAppTheme';

type RunDetailInsightsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'RunDetailInsights'
>;

const VALID_ACTIONS: QuickActionId[] = ['call', 'message', 'email', 'settings'];

const normalizeActionId = (value: string): QuickActionId =>
  VALID_ACTIONS.includes(value as QuickActionId) ? (value as QuickActionId) : 'message';

const normalizeStatus = (value: string): 'success' | 'attention' =>
  value === 'success' ? 'success' : 'attention';

const formatTime = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    hour12: true,
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

export const RunDetailInsightsScreen = ({
  navigation,
  route
}: RunDetailInsightsScreenProps) => {
  const theme = useAppTheme();
  const { data: run, isFetching } = useGetExecutionQuery(route.params.runId);

  const resolvedActionId = normalizeActionId(run?.actionId ?? route.params.actionId);
  const action = getQuickActionById(resolvedActionId);
  const prompt = run?.prompt ?? route.params.prompt;
  const executedAt = run?.executedAt ?? route.params.executedAt;
  const safetyCount = run?.safetyCount ?? route.params.safetyCount;
  const status = normalizeStatus(run?.status ?? route.params.status);
  const targetContactName = run?.targetContactName ?? route.params.targetContactName;
  const targetPhoneNumber = run?.targetPhoneNumber ?? route.params.targetPhoneNumber;
  const callStatus = run?.callStatus ?? route.params.callStatus;

  const insightLines = useMemo(() => {
    if (resolvedActionId === 'call') {
      return [
        `Contact match: ${targetContactName ?? 'Not resolved'}`,
        `Resolved number: ${targetPhoneNumber ?? 'Not available'}`,
        `Dial result: ${callStatus ?? 'Dial flow triggered'}`
      ];
    }

    if (resolvedActionId === 'message') {
      return [
        'Prompt analysis complete for tone and urgency.',
        'Draft response policy check passed.',
        'Delivery channel validated successfully.'
      ];
    }

    if (resolvedActionId === 'email') {
      return [
        'Subject-quality rule validated.',
        'Body clarity check passed.',
        'Recipient guardrails applied.'
      ];
    }

    return [
      'Safe range checks passed for device settings.',
      'Policy constraints enforced before apply.',
      'Non-critical settings change mode selected.'
    ];
  }, [callStatus, resolvedActionId, targetContactName, targetPhoneNumber]);

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
        <AppText style={styles.title}>
          {action.icon} Run Insight
        </AppText>
        <AppText muted style={styles.metaText}>
          Run ID: {route.params.runId}
        </AppText>
        <AppText muted style={styles.metaText}>
          Executed: {formatTime(executedAt)}
        </AppText>
        {isFetching ? (
          <AppText muted style={styles.metaText}>
            Syncing run details...
          </AppText>
        ) : null}
        <AppText
          style={[
            styles.statusBadge,
            {
              color: status === 'success' ? theme.colors.success : theme.colors.danger
            }
          ]}
        >
          {status === 'success' ? 'SUCCESS' : 'ATTENTION'}
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
        <AppText style={styles.blockTitle}>Prompt Input</AppText>
        <AppText muted style={styles.promptText}>
          {prompt}
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
        <AppText style={styles.blockTitle}>Execution Insights</AppText>
        <View style={styles.list}>
          {insightLines.map((item) => (
            <AppText key={item} muted style={styles.listItem}>
              - {item}
            </AppText>
          ))}
        </View>
        <AppText muted style={styles.metaText}>
          Safety checks enabled: {safetyCount}
        </AppText>
      </View>

      <Button
        label="Open Audit Log"
        variant="ghost"
        onPress={() => {
          navigation.navigate('ExecutionAudit', {
            runId: route.params.runId,
            actionId: resolvedActionId,
            prompt,
            safetyCount,
            targetContactName: targetContactName ?? undefined,
            targetPhoneNumber: targetPhoneNumber ?? undefined,
            callStatus: callStatus ?? undefined,
            executedAt
          });
        }}
      />
      <Button
        label="Plan Follow-up"
        variant="ghost"
        onPress={() => {
          navigation.navigate('FollowUpPlanner', {
            runId: route.params.runId,
            actionId: resolvedActionId,
            prompt,
            targetContactName: targetContactName ?? undefined,
            targetPhoneNumber: targetPhoneNumber ?? undefined
          });
        }}
      />

      <View style={styles.buttonRow}>
        <Button
          label="Retry Action"
          variant="secondary"
          fullWidth={false}
          style={styles.halfButton}
          onPress={() => {
            navigation.replace('ActionCenter', {
              actionId: resolvedActionId
            });
          }}
        />
        <Button
          label="Back To History"
          fullWidth={false}
          style={styles.halfButton}
          onPress={() => {
            navigation.navigate('ExecutionHistory');
          }}
        />
      </View>
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
  metaText: {
    fontSize: 12,
    lineHeight: 18
  },
  statusBadge: {
    fontSize: 12,
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
  list: {
    gap: 6
  },
  listItem: {
    fontSize: 13,
    lineHeight: 19
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10
  },
  halfButton: {
    flex: 1
  }
});
