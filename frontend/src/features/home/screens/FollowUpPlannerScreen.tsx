import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AppText } from '@/components/ui/Text';
import { getQuickActionById } from '@/features/home/types/home';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useAppTheme } from '@/theme/useAppTheme';

type FollowUpPlannerScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'FollowUpPlanner'
>;

type FollowUpSlot = {
  id: string;
  label: string;
  detail: string;
};

type Channel = 'notification' | 'message' | 'email';

const FOLLOW_UP_SLOTS: FollowUpSlot[] = [
  { id: '15m', label: 'In 15 mins', detail: 'Quick callback or confirmation ping.' },
  { id: '1h', label: 'In 1 hour', detail: 'Ideal for pending responses.' },
  { id: 'today', label: 'Today 6:00 PM', detail: 'End-of-day follow-up check.' },
  { id: 'tomorrow', label: 'Tomorrow 10:00 AM', detail: 'Next working slot reminder.' }
];

const CHANNELS: { id: Channel; label: string }[] = [
  { id: 'notification', label: 'In-app Alert' },
  { id: 'message', label: 'Message Draft' },
  { id: 'email', label: 'Email Draft' }
];

export const FollowUpPlannerScreen = ({ navigation, route }: FollowUpPlannerScreenProps) => {
  const theme = useAppTheme();
  const action = getQuickActionById(route.params.actionId);

  const defaultNote =
    action.id === 'call'
      ? `Follow up with ${route.params.targetContactName ?? 'contact'} and confirm next steps.`
      : `Follow up on ${action.title.toLowerCase()} result.`;

  const [slotId, setSlotId] = useState<string>(route.params.prefillSlotId ?? FOLLOW_UP_SLOTS[1].id);
  const [channel, setChannel] = useState<Channel>(route.params.prefillChannel ?? 'notification');
  const [note, setNote] = useState(route.params.prefillNote ?? defaultNote);
  const [status, setStatus] = useState<string | null>(null);

  const selectedSlot = useMemo(
    () => FOLLOW_UP_SLOTS.find((item) => item.id === slotId) ?? FOLLOW_UP_SLOTS[0],
    [slotId]
  );

  useEffect(() => {
    if (route.params.prefillSlotId) {
      setSlotId(route.params.prefillSlotId);
    }
    if (route.params.prefillChannel) {
      setChannel(route.params.prefillChannel);
    }
    if (route.params.prefillNote) {
      setNote(route.params.prefillNote);
    }
  }, [route.params.prefillChannel, route.params.prefillNote, route.params.prefillSlotId]);

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
        <AppText style={styles.title}>Follow-up Planner</AppText>
        <AppText muted style={styles.subtitle}>
          Run ID: {route.params.runId}
        </AppText>
        <AppText muted style={styles.subtitle}>
          Action: {action.title}
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
        <AppText style={styles.blockTitle}>When to follow up?</AppText>
        <View style={styles.list}>
          {FOLLOW_UP_SLOTS.map((slot) => {
            const isActive = slot.id === slotId;

            return (
              <Pressable
                key={slot.id}
                onPress={() => setSlotId(slot.id)}
                style={[
                  styles.row,
                  {
                    borderColor: isActive ? theme.colors.primary : theme.colors.border,
                    backgroundColor: isActive ? theme.colors.surfaceAlt : theme.colors.surface
                  }
                ]}
              >
                <AppText style={styles.rowTitle}>{slot.label}</AppText>
                <AppText muted style={styles.rowDetail}>
                  {slot.detail}
                </AppText>
              </Pressable>
            );
          })}
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
        <AppText style={styles.blockTitle}>Follow-up Channel</AppText>
        <View style={styles.channelRow}>
          {CHANNELS.map((item) => {
            const isActive = item.id === channel;
            return (
              <Pressable
                key={item.id}
                onPress={() => setChannel(item.id)}
                style={[
                  styles.channelChip,
                  {
                    borderColor: isActive ? theme.colors.primary : theme.colors.border,
                    backgroundColor: isActive ? theme.colors.surfaceAlt : theme.colors.surface,
                    borderRadius: theme.radius.md
                  }
                ]}
              >
                <AppText style={styles.channelText}>{item.label}</AppText>
              </Pressable>
            );
          })}
        </View>

        <Input
          label="Follow-up Note"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={4}
          style={styles.noteInput}
          placeholder="Add context for your next follow-up..."
        />
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
        <AppText style={styles.blockTitle}>Preview</AppText>
        <AppText muted style={styles.previewText}>
          Schedule: {selectedSlot.label}
        </AppText>
        <AppText muted style={styles.previewText}>
          Channel: {CHANNELS.find((item) => item.id === channel)?.label}
        </AppText>
        <AppText muted style={styles.previewText}>
          Note: {note.trim() || 'No note added.'}
        </AppText>
      </View>

      <Button
        label="Open Templates"
        variant="ghost"
        onPress={() => {
          navigation.navigate('FollowUpTemplates', {
            runId: route.params.runId,
            actionId: route.params.actionId,
            prompt: route.params.prompt,
            targetContactName: route.params.targetContactName,
            targetPhoneNumber: route.params.targetPhoneNumber
          });
        }}
      />

      <Button
        label="Schedule Follow-up"
        onPress={() => {
          if (!note.trim()) {
            setStatus('Please add a short follow-up note before scheduling.');
            return;
          }

          setStatus(`Follow-up scheduled for ${selectedSlot.label} via ${channel}.`);
        }}
      />

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

      <View style={styles.buttonRow}>
        <Button
          label="Back To Run"
          variant="secondary"
          fullWidth={false}
          style={styles.halfButton}
          onPress={() => {
            navigation.goBack();
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
  blockTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  list: {
    gap: 8
  },
  row: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700'
  },
  rowDetail: {
    fontSize: 12,
    lineHeight: 17
  },
  channelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6
  },
  channelChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  channelText: {
    fontSize: 12,
    fontWeight: '700'
  },
  noteInput: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  previewText: {
    fontSize: 12,
    lineHeight: 18
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10
  },
  halfButton: {
    flex: 1
  }
});
