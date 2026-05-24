import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import { getQuickActionById } from '@/features/home/types/home';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useAppTheme } from '@/theme/useAppTheme';

type ExecutionAuditScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ExecutionAudit'
>;

type AuditEvent = {
  id: string;
  title: string;
  detail: string;
  status: 'ok' | 'info';
};

const AUDIT_GUARDS = [
  'Permission gate checked before action start',
  'Task scope limited to one selected quick action',
  'Sensitive values masked in runtime logs',
  'Risk policy checks passed before dispatch'
];

const formatTime = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    hour12: true,
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

export const ExecutionAuditScreen = ({ navigation, route }: ExecutionAuditScreenProps) => {
  const theme = useAppTheme();
  const action = getQuickActionById(route.params.actionId);

  const auditEvents = useMemo<AuditEvent[]>(() => {
    const commonEvents: AuditEvent[] = [
      {
        id: 'queued',
        title: 'Task accepted',
        detail: `Prompt accepted for ${action.title.toLowerCase()} execution.`,
        status: 'ok'
      },
      {
        id: 'safety',
        title: 'Safety checks applied',
        detail: `${route.params.safetyCount} safety checks enabled.`,
        status: 'ok'
      },
      {
        id: 'execute',
        title: 'Action execution',
        detail: 'Execution performed in guarded mode with policy checks.',
        status: 'ok'
      }
    ];

    if (action.id === 'call') {
      commonEvents.push({
        id: 'call',
        title: 'Dial attempt',
        detail: route.params.callStatus ?? 'Dialer launch requested from smart call flow.',
        status: 'info'
      });
    }

    return commonEvents;
  }, [action.id, action.title, route.params.callStatus, route.params.safetyCount]);

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
        <AppText style={styles.title}>Audit Log</AppText>
        <AppText muted style={styles.metaText}>
          Action: {action.title}
        </AppText>
        <AppText muted style={styles.metaText}>
          Executed at: {formatTime(route.params.executedAt)}
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
        <AppText style={styles.blockTitle}>Timeline</AppText>
        <View style={styles.list}>
          {auditEvents.map((event) => (
            <View
              key={event.id}
              style={[
                styles.listItem,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceAlt
                }
              ]}
            >
              <AppText style={styles.eventTitle}>
                {event.status === 'ok' ? 'OK' : 'IN'} {event.title}
              </AppText>
              <AppText muted style={styles.eventDetail}>
                {event.detail}
              </AppText>
            </View>
          ))}
        </View>
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
        <AppText style={styles.blockTitle}>Security Trail</AppText>
        <View style={styles.list}>
          {AUDIT_GUARDS.map((item) => (
            <AppText key={item} muted style={styles.guardItem}>
              - {item}
            </AppText>
          ))}
        </View>
      </View>

      <Button
        label="Back To Summary"
        variant="secondary"
        onPress={() => {
          navigation.goBack();
        }}
      />
      <Button
        label="Back To Home"
        onPress={() => {
          navigation.popToTop();
        }}
      />
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
  list: {
    gap: 8,
    marginTop: 2
  },
  listItem: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 2
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '700'
  },
  eventDetail: {
    fontSize: 12,
    lineHeight: 17
  },
  guardItem: {
    fontSize: 13,
    lineHeight: 19
  }
});
