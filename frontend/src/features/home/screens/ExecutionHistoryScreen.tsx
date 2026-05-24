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
import { useGetExecutionHistoryQuery } from '@/features/workspace/api/workspaceApi';
import type { ExecutionHistoryItem } from '@/features/workspace/types/workspace';

type ExecutionHistoryScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ExecutionHistory'
>;

type FilterId = 'all' | QuickActionId;

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'call', label: 'Calls' },
  { id: 'message', label: 'Messages' },
  { id: 'email', label: 'Emails' },
  { id: 'settings', label: 'Settings' }
];

const formatTime = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    hour12: true,
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

const normalizeStatus = (status: string): 'success' | 'attention' =>
  status === 'success' ? 'success' : 'attention';

const mapHistory = (items: ExecutionHistoryItem[]) =>
  items.map((item) => ({
    id: item.id,
    actionId: (item.actionId as QuickActionId) ?? 'message',
    prompt: item.prompt,
    executedAt: item.executedAt,
    safetyCount: item.safetyCount,
    status: normalizeStatus(item.status),
    targetContactName: item.targetContactName ?? undefined,
    targetPhoneNumber: item.targetPhoneNumber ?? undefined,
    callStatus: item.callStatus ?? undefined
  }));

export const ExecutionHistoryScreen = ({ navigation }: ExecutionHistoryScreenProps) => {
  const theme = useAppTheme();
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const { data, isFetching, refetch } = useGetExecutionHistoryQuery({
    limit: 60
  });

  const records = useMemo(() => mapHistory(data ?? []), [data]);

  const filteredRecords = useMemo(() => {
    if (activeFilter === 'all') {
      return records;
    }

    return records.filter((item) => item.actionId === activeFilter);
  }, [activeFilter, records]);

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
          Review past runs and open detailed insights + audit logs.
        </AppText>
        <AppText muted style={styles.summaryText}>
          Showing {filteredRecords.length} runs, {successCount} successful.
        </AppText>
        {isFetching ? (
          <AppText muted style={styles.summaryText}>
            Syncing latest runs...
          </AppText>
        ) : null}
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
        {filteredRecords.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.md
              }
            ]}
          >
            <AppText muted>No runs yet. Execute any action and it will appear here.</AppText>
          </View>
        ) : null}

        {filteredRecords.map((record) => {
          const action = getQuickActionById(record.actionId);

          return (
            <Pressable
              key={record.id}
              onPress={() => {
                navigation.navigate('RunDetailInsights', {
                  runId: record.id,
                  actionId: record.actionId,
                  prompt: record.prompt,
                  executedAt: record.executedAt,
                  safetyCount: record.safetyCount,
                  status: record.status,
                  targetContactName: record.targetContactName,
                  targetPhoneNumber: record.targetPhoneNumber,
                  callStatus: record.callStatus
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

      <View style={styles.buttonRow}>
        <Button
          label="Refresh"
          variant="ghost"
          fullWidth={false}
          style={styles.halfButton}
          onPress={() => {
            void refetch();
          }}
          isLoading={isFetching}
        />
        <Button
          label="Back To Home"
          variant="secondary"
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
    fontSize: 12
  },
  emptyCard: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10
  },
  halfButton: {
    flex: 1
  }
});
