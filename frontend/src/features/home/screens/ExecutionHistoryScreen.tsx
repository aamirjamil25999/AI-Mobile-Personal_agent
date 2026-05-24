import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import { getQuickActionById } from '@/features/home/types/home';
import type { QuickActionId } from '@/features/home/types/home';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useAppTheme } from '@/theme/useAppTheme';

type ExecutionHistoryScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ExecutionHistory'
>;

type FilterId = 'all' | QuickActionId;

type HistoryRecord = {
  id: string;
  actionId: QuickActionId;
  prompt: string;
  executedAt: string;
  safetyCount: number;
  status: 'success' | 'attention';
  targetContactName?: string;
  targetPhoneNumber?: string;
  callStatus?: string;
};

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'call', label: 'Calls' },
  { id: 'message', label: 'Messages' },
  { id: 'email', label: 'Emails' },
  { id: 'settings', label: 'Settings' }
];

const HISTORY_RECORDS: HistoryRecord[] = [
  {
    id: 'run-107',
    actionId: 'call',
    prompt: 'Call Aman and sync tomorrow timeline in under 3 minutes.',
    executedAt: '2026-05-24T07:25:00.000Z',
    safetyCount: 3,
    status: 'success',
    targetContactName: 'Aman',
    targetPhoneNumber: '9899994567',
    callStatus: 'Dialer opened for 9899994567'
  },
  {
    id: 'run-106',
    actionId: 'email',
    prompt: 'Draft leave email for Monday with handover details.',
    executedAt: '2026-05-24T06:45:00.000Z',
    safetyCount: 3,
    status: 'success'
  },
  {
    id: 'run-105',
    actionId: 'message',
    prompt: 'Send icon deadline reminder to design group.',
    executedAt: '2026-05-24T05:20:00.000Z',
    safetyCount: 2,
    status: 'success'
  },
  {
    id: 'run-104',
    actionId: 'settings',
    prompt: 'Set low power mode from 20% and dim brightness to 35%.',
    executedAt: '2026-05-23T19:35:00.000Z',
    safetyCount: 3,
    status: 'success'
  },
  {
    id: 'run-103',
    actionId: 'call',
    prompt: 'Call Rohit for investor deck update and capture key blockers.',
    executedAt: '2026-05-23T16:10:00.000Z',
    safetyCount: 2,
    status: 'attention',
    targetContactName: 'Rohit',
    callStatus: 'Contacts permission denied. Please allow contacts access.'
  }
];

const formatTime = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    hour12: true,
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

export const ExecutionHistoryScreen = ({ navigation }: ExecutionHistoryScreenProps) => {
  const theme = useAppTheme();
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');

  const filteredRecords = useMemo(() => {
    if (activeFilter === 'all') {
      return HISTORY_RECORDS;
    }

    return HISTORY_RECORDS.filter((item) => item.actionId === activeFilter);
  }, [activeFilter]);

  const successCount = useMemo(
    () => filteredRecords.filter((item) => item.status === 'success').length,
    [filteredRecords]
  );

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
        <AppText style={styles.title}>Execution History</AppText>
        <AppText muted style={styles.subtitle}>
          Review past runs and open audit logs for any execution.
        </AppText>
        <AppText muted style={styles.summaryText}>
          Showing {filteredRecords.length} runs, {successCount} successful.
        </AppText>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((filter) => {
          const isActive = filter.id === activeFilter;

          return (
            <Pressable
              key={filter.id}
              onPress={() => setActiveFilter(filter.id)}
              style={[
                styles.filterChip,
                {
                  borderColor: isActive ? theme.colors.primary : theme.colors.border,
                  backgroundColor: isActive ? theme.colors.surfaceAlt : theme.colors.surface,
                  borderRadius: theme.radius.md
                }
              ]}
            >
              <AppText style={styles.filterLabel}>{filter.label}</AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.list}>
        {filteredRecords.map((record) => {
          const action = getQuickActionById(record.actionId);

          return (
            <Pressable
              key={record.id}
              onPress={() => {
                navigation.navigate('ExecutionAudit', {
                  actionId: record.actionId,
                  prompt: record.prompt,
                  safetyCount: record.safetyCount,
                  targetContactName: record.targetContactName,
                  targetPhoneNumber: record.targetPhoneNumber,
                  callStatus: record.callStatus,
                  executedAt: record.executedAt
                });
              }}
              style={[
                styles.listItem,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.md
                }
              ]}
            >
              <View style={styles.itemHead}>
                <AppText style={styles.itemTitle}>
                  {action.icon} {action.title}
                </AppText>
                <AppText
                  style={[
                    styles.statusBadge,
                    {
                      color:
                        record.status === 'success' ? theme.colors.success : theme.colors.danger
                    }
                  ]}
                >
                  {record.status === 'success' ? 'SUCCESS' : 'ATTENTION'}
                </AppText>
              </View>
              <AppText muted style={styles.itemPrompt} numberOfLines={2}>
                {record.prompt}
              </AppText>
              <AppText muted style={styles.itemMeta}>
                {formatTime(record.executedAt)} • Safety checks: {record.safetyCount}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <Button
        label="Back To Home"
        variant="secondary"
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
  subtitle: {
    fontSize: 12,
    lineHeight: 18
  },
  summaryText: {
    fontSize: 12
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  filterChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700'
  },
  list: {
    gap: 10
  },
  listItem: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6
  },
  itemHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700'
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '800'
  },
  itemPrompt: {
    fontSize: 12,
    lineHeight: 17
  },
  itemMeta: {
    fontSize: 11
  }
});
