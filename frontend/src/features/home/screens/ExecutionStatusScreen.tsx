import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, Linking } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import { getQuickActionById } from '@/features/home/types/home';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useAppTheme } from '@/theme/useAppTheme';

type ExecutionStatusScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ExecutionStatus'
>;

type ExecutionStep = {
  id: string;
  title: string;
  detail: string;
};

const EXECUTION_STEPS: ExecutionStep[] = [
  {
    id: 'queued',
    title: 'Task queued',
    detail: 'Task is accepted and waiting for safe execution slot.'
  },
  {
    id: 'planning',
    title: 'Planning action',
    detail: 'Agent is constructing step-by-step execution plan.'
  },
  {
    id: 'running',
    title: 'Executing safely',
    detail: 'Agent runs allowed operations with audit logging.'
  },
  {
    id: 'summary',
    title: 'Preparing summary',
    detail: 'Final result and notes are being prepared.'
  }
];

export const ExecutionStatusScreen = ({ navigation, route }: ExecutionStatusScreenProps) => {
  const theme = useAppTheme();
  const action = getQuickActionById(route.params.actionId);
  const [activeStep, setActiveStep] = useState(1);
  const [callStatus, setCallStatus] = useState<string | null>(null);

  const progressText = useMemo(() => {
    const total = EXECUTION_STEPS.length;
    const done = activeStep + 1;
    return `${done}/${total} steps in progress`;
  }, [activeStep]);

  const handleInitiateCall = async () => {
    if (!route.params.targetPhoneNumber) {
      setCallStatus('No phone number found. Go back and enter a valid number.');
      return;
    }

    const callUrl = `tel:${route.params.targetPhoneNumber}`;

    try {
      const supported = await Linking.canOpenURL(callUrl);
      if (!supported) {
        setCallStatus('Calling is not supported on this device.');
        return;
      }

      await Linking.openURL(callUrl);
      setCallStatus(`Dialer opened for ${route.params.targetPhoneNumber}`);
    } catch {
      setCallStatus('Failed to open dialer. Please try again.');
    }
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
        <AppText style={styles.title}>Execution Status</AppText>
        <AppText muted>
          Running: {action.title} with {route.params.safetyCount} safety checks
        </AppText>
        <AppText muted style={styles.promptPreview}>
          Prompt: {route.params.prompt}
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
        <AppText style={styles.blockTitle}>Progress</AppText>
        <AppText muted>{progressText}</AppText>

        <View style={styles.stepList}>
          {EXECUTION_STEPS.map((step, index) => {
            const isDone = index < activeStep;
            const isCurrent = index === activeStep;

            return (
              <Pressable
                key={step.id}
                onPress={() => setActiveStep(index)}
                style={[
                  styles.stepRow,
                  {
                    borderColor: isCurrent ? theme.colors.primary : theme.colors.border,
                    backgroundColor: isCurrent ? theme.colors.surfaceAlt : theme.colors.surface
                  }
                ]}
              >
                <AppText style={styles.marker}>{isDone ? 'OK' : isCurrent ? 'IN' : '--'}</AppText>
                <View style={styles.stepContent}>
                  <AppText style={styles.stepTitle}>{step.title}</AppText>
                  <AppText muted style={styles.stepDetail}>
                    {step.detail}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {action.id === 'call' ? (
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
          <AppText style={styles.blockTitle}>Smart Call</AppText>
          <AppText muted>
            {route.params.targetPhoneNumber
              ? `Ready to call ${route.params.targetPhoneNumber}`
              : 'Phone number missing in this execution context.'}
          </AppText>

          <Button
            label="Start Smart Call"
            onPress={() => {
              void handleInitiateCall();
            }}
          />

          {callStatus ? <AppText muted style={styles.callStatus}>{callStatus}</AppText> : null}
        </View>
      ) : null}

      <View style={styles.buttonRow}>
        <Button
          label="Back To Home"
          variant="secondary"
          fullWidth={false}
          style={styles.halfButton}
          onPress={() => {
            navigation.popToTop();
          }}
        />
        <Button
          label="Next Step"
          fullWidth={false}
          style={styles.halfButton}
          onPress={() => {
            setActiveStep((prev) => Math.min(prev + 1, EXECUTION_STEPS.length - 1));
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
  blockTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  promptPreview: {
    fontSize: 12,
    lineHeight: 18
  },
  stepList: {
    gap: 8,
    marginTop: 2
  },
  stepRow: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  marker: {
    width: 28,
    fontWeight: '700',
    fontSize: 12
  },
  stepContent: {
    flex: 1,
    gap: 1
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700'
  },
  stepDetail: {
    fontSize: 12,
    lineHeight: 16
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10
  },
  halfButton: {
    flex: 1
  },
  callStatus: {
    fontSize: 12,
    marginTop: 2
  }
});
