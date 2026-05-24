import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import { getQuickActionById } from '@/features/home/types/home';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useAppTheme } from '@/theme/useAppTheme';

type RunDetailInsightsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'RunDetailInsights'
>;

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
  const action = getQuickActionById(route.params.actionId);

  const insightLines = useMemo(() => {
    if (action.id === 'call') {
      return [
        `Contact match: ${route.params.targetContactName ?? 'Not resolved'}`,
        `Resolved number: ${route.params.targetPhoneNumber ?? 'Not available'}`,
        `Dial result: ${route.params.callStatus ?? 'Dial flow triggered'}`
      ];
    }

    if (action.id === 'message') {
      return [
        'Prompt analysis complete for tone and urgency.',
        'Draft response policy check passed.',
        'Delivery channel validated successfully.'
      ];
    }

    if (action.id === 'email') {
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
  }, [
    action.id,
    route.params.callStatus,
    route.params.targetContactName,
    route.params.targetPhoneNumber
  ]);

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
          Executed: {formatTime(route.params.executedAt)}
        </AppText>
        <AppText
          style={[
            styles.statusBadge,
            {
              color: route.params.status === 'success' ? theme.colors.success : theme.colors.danger
            }
          ]}
        >
          {route.params.status === 'success' ? 'SUCCESS' : 'ATTENTION'}
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
          {route.params.prompt}
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
          Safety checks enabled: {route.params.safetyCount}
        </AppText>
      </View>

      <Button
        label="Open Audit Log"
        variant="ghost"
        onPress={() => {
          navigation.navigate('ExecutionAudit', {
            actionId: route.params.actionId,
            prompt: route.params.prompt,
            safetyCount: route.params.safetyCount,
            targetContactName: route.params.targetContactName,
            targetPhoneNumber: route.params.targetPhoneNumber,
            callStatus: route.params.callStatus,
            executedAt: route.params.executedAt
          });
        }}
      />
      <Button
        label="Plan Follow-up"
        variant="ghost"
        onPress={() => {
          navigation.navigate('FollowUpPlanner', {
            runId: route.params.runId,
            actionId: route.params.actionId,
            prompt: route.params.prompt,
            targetContactName: route.params.targetContactName,
            targetPhoneNumber: route.params.targetPhoneNumber
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
              actionId: route.params.actionId
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
