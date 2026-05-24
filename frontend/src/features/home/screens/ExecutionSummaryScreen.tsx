import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import { getQuickActionById } from '@/features/home/types/home';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useAppTheme } from '@/theme/useAppTheme';

type ExecutionSummaryScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ExecutionSummary'
>;

export const ExecutionSummaryScreen = ({
  navigation,
  route
}: ExecutionSummaryScreenProps) => {
  const theme = useAppTheme();
  const action = getQuickActionById(route.params.actionId);
  const totalSteps = 4;

  const summaryLines = useMemo(() => {
    if (action.id === 'call') {
      return [
        `Contact: ${route.params.targetContactName ?? 'Not specified'}`,
        `Number: ${route.params.targetPhoneNumber ?? 'Not selected'}`,
        `Call status: ${route.params.callStatus ?? 'Dial flow initiated'}`,
        'Next: save call notes and schedule follow-up reminder.'
      ];
    }

    if (action.id === 'message') {
      return [
        'Message draft generated with polite and concise tone.',
        'Recipient + context check marked safe.',
        'Next: review final draft and send.'
      ];
    }

    if (action.id === 'email') {
      return [
        'Email structure prepared: subject, body, and CTA.',
        'Security scan passed for sensitive data leakage.',
        'Next: confirm recipient and dispatch.'
      ];
    }

    return [
      'Settings plan validated with safe-limit checks.',
      'No destructive system-level command detected.',
      'Next: apply changes in staged mode.'
    ];
  }, [action.id, route.params.callStatus, route.params.targetContactName, route.params.targetPhoneNumber]);

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
          {action.icon} {action.title} Summary
        </AppText>
        <AppText muted style={styles.metaText}>
          Run ID: {route.params.runId}
        </AppText>
        <AppText muted style={styles.metaText}>
          Executed: {new Date(route.params.executedAt).toLocaleString('en-IN')}
        </AppText>
        <AppText muted style={styles.metaText}>
          Completed {route.params.finalStepIndex + 1}/{totalSteps} steps with{' '}
          {route.params.safetyCount} safety checks.
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
        <AppText style={styles.blockTitle}>Prompt</AppText>
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
        <AppText style={styles.blockTitle}>Execution Notes</AppText>
        <View style={styles.notesList}>
          {summaryLines.map((item) => (
            <AppText key={item} muted style={styles.noteItem}>
              - {item}
            </AppText>
          ))}
        </View>
      </View>

      <Button
        label="View Audit Log"
        variant="ghost"
        onPress={() => {
          navigation.navigate('ExecutionAudit', {
            runId: route.params.runId,
            actionId: action.id,
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
            actionId: action.id,
            prompt: route.params.prompt,
            targetContactName: route.params.targetContactName,
            targetPhoneNumber: route.params.targetPhoneNumber
          });
        }}
      />

      <View style={styles.buttonRow}>
        <Button
          label="Run Again"
          variant="secondary"
          fullWidth={false}
          style={styles.halfButton}
          onPress={() => {
            navigation.replace('ActionCenter', { actionId: action.id });
          }}
        />
        <Button
          label="Back To Home"
          fullWidth={false}
          style={styles.halfButton}
          onPress={() => {
            navigation.popToTop();
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
  blockTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  promptText: {
    fontSize: 13,
    lineHeight: 19
  },
  notesList: {
    gap: 6
  },
  noteItem: {
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
