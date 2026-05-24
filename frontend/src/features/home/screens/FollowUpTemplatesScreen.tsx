import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import type { QuickActionId } from '@/features/home/types/home';
import { getQuickActionById } from '@/features/home/types/home';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useAppTheme } from '@/theme/useAppTheme';

type FollowUpTemplatesScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'FollowUpTemplates'
>;

type TemplateChannel = 'notification' | 'message' | 'email';

type FollowUpTemplate = {
  id: string;
  title: string;
  slotId: string;
  channel: TemplateChannel;
  note: string;
};

const TEMPLATE_MAP: Record<QuickActionId, FollowUpTemplate[]> = {
  call: [
    {
      id: 'call-confirm',
      title: 'Call Confirmation',
      slotId: '15m',
      channel: 'message',
      note: 'Share short recap of call and confirm next meeting slot.'
    },
    {
      id: 'call-docs',
      title: 'Pending Docs Reminder',
      slotId: '1h',
      channel: 'email',
      note: 'Request pending documents discussed on call with deadline.'
    },
    {
      id: 'call-eod',
      title: 'End Of Day Callback',
      slotId: 'today',
      channel: 'notification',
      note: 'Check if callback is needed before day end.'
    }
  ],
  message: [
    {
      id: 'msg-check',
      title: 'Message Reply Check',
      slotId: '1h',
      channel: 'notification',
      note: 'Check if recipient replied and send follow-up if needed.'
    },
    {
      id: 'msg-eod',
      title: 'EOD Reminder',
      slotId: 'today',
      channel: 'message',
      note: 'Send second reminder if no response received by evening.'
    },
    {
      id: 'msg-tomorrow',
      title: 'Morning Nudge',
      slotId: 'tomorrow',
      channel: 'message',
      note: 'Send polite nudge tomorrow morning with clear CTA.'
    }
  ],
  email: [
    {
      id: 'email-ack',
      title: 'Acknowledgement Follow-up',
      slotId: '1h',
      channel: 'email',
      note: 'If no response, send concise follow-up with key highlights.'
    },
    {
      id: 'email-summary',
      title: 'Decision Summary',
      slotId: 'today',
      channel: 'email',
      note: 'Share summary and ask for approval before close of day.'
    },
    {
      id: 'email-morning',
      title: 'Morning Escalation',
      slotId: 'tomorrow',
      channel: 'email',
      note: 'Escalate to alternate owner if response is still pending.'
    }
  ],
  settings: [
    {
      id: 'set-verify',
      title: 'Settings Verification',
      slotId: '15m',
      channel: 'notification',
      note: 'Verify changed settings are active and stable.'
    },
    {
      id: 'set-battery',
      title: 'Battery Impact Check',
      slotId: '1h',
      channel: 'notification',
      note: 'Review battery and performance impact after settings update.'
    },
    {
      id: 'set-morning',
      title: 'Morning Health Review',
      slotId: 'tomorrow',
      channel: 'notification',
      note: 'Run morning check for network, battery, and brightness profile.'
    }
  ]
};

export const FollowUpTemplatesScreen = ({
  navigation,
  route
}: FollowUpTemplatesScreenProps) => {
  const theme = useAppTheme();
  const action = getQuickActionById(route.params.actionId);
  const templates = TEMPLATE_MAP[route.params.actionId];
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id ?? '');

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedTemplateId) ?? templates[0],
    [selectedTemplateId, templates]
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
        <AppText style={styles.title}>Follow-up Templates</AppText>
        <AppText muted style={styles.subtitle}>
          Action: {action.title}
        </AppText>
        <AppText muted style={styles.subtitle}>
          Use a template to prefill your follow-up planner.
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
        <AppText style={styles.blockTitle}>Template List</AppText>
        <View style={styles.list}>
          {templates.map((template) => {
            const isActive = template.id === selectedTemplateId;

            return (
              <Pressable
                key={template.id}
                onPress={() => setSelectedTemplateId(template.id)}
                style={[
                  styles.templateRow,
                  {
                    borderColor: isActive ? theme.colors.primary : theme.colors.border,
                    backgroundColor: isActive ? theme.colors.surfaceAlt : theme.colors.surface
                  }
                ]}
              >
                <AppText style={styles.templateTitle}>{template.title}</AppText>
                <AppText muted style={styles.templateMeta}>
                  Slot: {template.slotId} • Channel: {template.channel}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {selectedTemplate ? (
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
          <AppText style={styles.blockTitle}>Template Preview</AppText>
          <AppText muted style={styles.previewText}>
            {selectedTemplate.note}
          </AppText>
        </View>
      ) : null}

      <Button
        label="Use This Template"
        onPress={() => {
          if (!selectedTemplate) {
            return;
          }

          navigation.navigate('FollowUpPlanner', {
            runId: route.params.runId,
            actionId: route.params.actionId,
            prompt: route.params.prompt,
            targetContactName: route.params.targetContactName,
            targetPhoneNumber: route.params.targetPhoneNumber,
            prefillSlotId: selectedTemplate.slotId,
            prefillChannel: selectedTemplate.channel,
            prefillNote: selectedTemplate.note
          });
        }}
      />

      <Button
        label="Back To Planner"
        variant="secondary"
        onPress={() => {
          navigation.goBack();
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
  blockTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  list: {
    gap: 8
  },
  templateRow: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: '700'
  },
  templateMeta: {
    fontSize: 12
  },
  previewText: {
    fontSize: 13,
    lineHeight: 19
  }
});
