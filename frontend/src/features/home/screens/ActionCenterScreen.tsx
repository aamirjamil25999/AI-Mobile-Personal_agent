import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AppText } from '@/components/ui/Text';
import { getQuickActionById } from '@/features/home/types/home';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useAppTheme } from '@/theme/useAppTheme';

type ActionCenterScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ActionCenter'
>;

const DEFAULT_PROMPTS: Record<string, string> = {
  call: 'Call Aman and ask if tomorrow meeting can be moved to 11 AM. Then summarize in 3 bullet points.',
  message:
    'Send a polite reminder to the design team: please share final app icons before 5 PM today.',
  email:
    'Draft an email to hr@company.com requesting leave for Monday with concise reason and handover note.',
  settings:
    'Enable battery saver at 20%, keep Wi-Fi ON, and reduce screen brightness to 35%.'
};

export const ActionCenterScreen = ({ navigation, route }: ActionCenterScreenProps) => {
  const theme = useAppTheme();
  const action = getQuickActionById(route.params.actionId);

  const [prompt, setPrompt] = useState(
    DEFAULT_PROMPTS[action.id] ?? 'Describe the automation task here.'
  );
  const [status, setStatus] = useState<string | null>(null);

  const helperText = useMemo(() => {
    if (action.id === 'call') {
      return 'Tip: include contact name + objective + summary format.';
    }

    if (action.id === 'message') {
      return 'Tip: mention tone, recipient, and hard deadline.';
    }

    if (action.id === 'email') {
      return 'Tip: include recipient, subject intent, and CTA.';
    }

    return 'Tip: mention exact setting values and safety limits.';
  }, [action.id]);

  return (
    <ScreenContainer contentStyle={styles.container}>
      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg
          }
        ]}
      >
        <AppText style={styles.title}>
          {action.icon} {action.title}
        </AppText>
        <AppText muted style={styles.subtitle}>
          {action.description}
        </AppText>
      </View>

      <View
        style={[
          styles.promptCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md
          }
        ]}
      >
        <Input
          label="Task Prompt"
          value={prompt}
          onChangeText={setPrompt}
          multiline
          numberOfLines={5}
          style={styles.promptInput}
          placeholder="Tell the agent what to do..."
        />

        <AppText muted style={styles.helperText}>
          {helperText}
        </AppText>

        <Button
          label="Run Action"
          onPress={() => {
            if (!prompt.trim()) {
              setStatus('Please add task details before running.');
              return;
            }

            setStatus('Queued successfully. Execution pipeline is ready for backend integration.');
          }}
        />
      </View>

      {status ? (
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md
            }
          ]}
        >
          <AppText style={styles.statusTitle}>Status</AppText>
          <AppText muted>{status}</AppText>
        </View>
      ) : null}

      <Button label="Back to Dashboard" variant="secondary" onPress={() => navigation.goBack()} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14
  },
  headerCard: {
    borderWidth: 1,
    padding: 16,
    gap: 6
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800'
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18
  },
  promptCard: {
    borderWidth: 1,
    padding: 14,
    gap: 8
  },
  promptInput: {
    minHeight: 120,
    textAlignVertical: 'top'
  },
  helperText: {
    fontSize: 12,
    marginTop: -2,
    marginBottom: 2
  },
  statusCard: {
    borderWidth: 1,
    padding: 14,
    gap: 6
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '700'
  }
});
