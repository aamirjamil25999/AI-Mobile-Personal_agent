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

type NotificationsInboxScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'NotificationsInbox'
>;

type InboxStatus = 'pending' | 'done';

type InboxItem = {
  id: string;
  title: string;
  note: string;
  channel: 'notification' | 'message' | 'email';
  actionId: QuickActionId;
  dueAt: string;
  status: InboxStatus;
};

type FilterId = 'all' | InboxStatus;

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'done', label: 'Done' }
];

const CHANNEL_LABEL: Record<InboxItem['channel'], string> = {
  notification: 'In-app Alert',
  message: 'Message Draft',
  email: 'Email Draft'
};

const DEFAULT_ITEMS: InboxItem[] = [
  {
    id: 'fx-201',
    title: 'Follow up with Aman',
    note: 'Share call summary and confirm meeting time.',
    channel: 'message',
    actionId: 'call',
    dueAt: '2026-05-24T10:30:00.000Z',
    status: 'pending'
  },
  {
    id: 'fx-202',
    title: 'Leave email reminder',
    note: 'Check HR response and send polite follow-up if pending.',
    channel: 'email',
    actionId: 'email',
    dueAt: '2026-05-24T13:00:00.000Z',
    status: 'pending'
  },
  {
    id: 'fx-203',
    title: 'Design icon deadline',
    note: 'Send second reminder with hard cutoff time.',
    channel: 'message',
    actionId: 'message',
    dueAt: '2026-05-24T15:15:00.000Z',
    status: 'pending'
  },
  {
    id: 'fx-204',
    title: 'Battery profile check',
    note: 'Confirm settings profile stayed applied after reboot.',
    channel: 'notification',
    actionId: 'settings',
    dueAt: '2026-05-23T18:30:00.000Z',
    status: 'done'
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

export const NotificationsInboxScreen = ({ navigation }: NotificationsInboxScreenProps) => {
  const theme = useAppTheme();
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const [items, setItems] = useState<InboxItem[]>(DEFAULT_ITEMS);
  const [status, setStatus] = useState<string | null>(null);

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === 'pending').length,
    [items]
  );

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') {
      return items;
    }
    return items.filter((item) => item.status === activeFilter);
  }, [activeFilter, items]);

  const toggleDone = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'done' ? 'pending' : 'done' }
          : item
      )
    );
  };

  const snoozeOneHour = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const nextTime = new Date(new Date(item.dueAt).getTime() + 60 * 60 * 1000).toISOString();
        return { ...item, dueAt: nextTime, status: 'pending' };
      })
    );
    setStatus('Task snoozed by 1 hour.');
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
        <AppText style={styles.title}>Follow-up Inbox</AppText>
        <AppText muted style={styles.subtitle}>
          Track reminders and pending follow-ups in one queue.
        </AppText>
        <AppText muted style={styles.subtitle}>
          Pending items: {pendingCount}
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
              <AppText style={styles.filterText}>{filter.label}</AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.list}>
        {filteredItems.map((item) => {
          const action = getQuickActionById(item.actionId);
          const isDone = item.status === 'done';

          return (
            <View
              key={item.id}
              style={[
                styles.itemCard,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.md
                }
              ]}
            >
              <View style={styles.itemTopRow}>
                <AppText style={styles.itemTitle}>
                  {action.icon} {item.title}
                </AppText>
                <AppText
                  style={[
                    styles.badge,
                    { color: isDone ? theme.colors.success : theme.colors.primary }
                  ]}
                >
                  {isDone ? 'DONE' : 'PENDING'}
                </AppText>
              </View>
              <AppText muted style={styles.metaText}>
                Channel: {CHANNEL_LABEL[item.channel]}
              </AppText>
              <AppText muted style={styles.metaText}>
                Due: {formatTime(item.dueAt)}
              </AppText>
              <AppText muted style={styles.noteText}>
                {item.note}
              </AppText>

              <View style={styles.actionRow}>
                <Button
                  label={isDone ? 'Mark Pending' : 'Mark Done'}
                  variant="secondary"
                  fullWidth={false}
                  style={styles.halfButton}
                  onPress={() => {
                    toggleDone(item.id);
                    setStatus(isDone ? 'Task moved to pending.' : 'Task marked as done.');
                  }}
                />
                <Button
                  label="Snooze +1h"
                  variant="ghost"
                  fullWidth={false}
                  style={styles.halfButton}
                  onPress={() => {
                    snoozeOneHour(item.id);
                  }}
                />
              </View>
              <Button
                label="Open Action"
                variant="ghost"
                onPress={() => {
                  navigation.navigate('ActionCenter', { actionId: item.actionId });
                }}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.actionRow}>
        <Button
          label="Back To Home"
          variant="secondary"
          fullWidth={false}
          style={styles.halfButton}
          onPress={() => {
            navigation.navigate('Home');
          }}
        />
        <Button
          label="Open History"
          fullWidth={false}
          style={styles.halfButton}
          onPress={() => {
            navigation.navigate('ExecutionHistory');
          }}
        />
      </View>

      {status ? (
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
          <AppText muted>{status}</AppText>
        </View>
      ) : null}
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
  filterText: {
    fontSize: 12,
    fontWeight: '700'
  },
  list: {
    gap: 10
  },
  itemCard: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700'
  },
  badge: {
    fontSize: 11,
    fontWeight: '800'
  },
  metaText: {
    fontSize: 12
  },
  noteText: {
    fontSize: 12,
    lineHeight: 17
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10
  },
  halfButton: {
    flex: 1
  }
});
