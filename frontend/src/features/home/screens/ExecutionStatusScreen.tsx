import React, { useEffect, useMemo, useState } from 'react';
import { Linking, PermissionsAndroid, Platform, Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Contacts from 'expo-contacts';
import * as IntentLauncher from 'expo-intent-launcher';

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

type ContactCandidate = {
  id: string;
  name: string;
  number: string;
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

const normalizeDialNumber = (value: string) => value.replace(/[^\d]/g, '').slice(0, 15);

const extractContactCandidates = (contacts: Contacts.Contact[]) => {
  const candidates: ContactCandidate[] = [];

  contacts.forEach((contact) => {
    const name = contact.name?.trim() || 'Unnamed contact';

    (contact.phoneNumbers ?? []).forEach((entry, index) => {
      const normalizedNumber = normalizeDialNumber(entry.number ?? '');
      if (!/^[0-9]{7,15}$/.test(normalizedNumber)) {
        return;
      }

      candidates.push({
        id: `${name}-${index}`,
        name,
        number: normalizedNumber
      });
    });
  });

  return candidates;
};

export const ExecutionStatusScreen = ({ navigation, route }: ExecutionStatusScreenProps) => {
  const theme = useAppTheme();
  const action = getQuickActionById(route.params.actionId);
  const targetContactName = route.params.targetContactName?.trim() ?? '';

  const [activeStep, setActiveStep] = useState(1);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [isFetchingContacts, setIsFetchingContacts] = useState(false);
  const [contactMatches, setContactMatches] = useState<ContactCandidate[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(
    route.params.targetPhoneNumber ?? null
  );

  const progressText = useMemo(() => {
    const total = EXECUTION_STEPS.length;
    const done = activeStep + 1;
    return `${done}/${total} steps in progress`;
  }, [activeStep]);

  const dialNumber = selectedNumber ?? route.params.targetPhoneNumber ?? null;

  const findContactMatches = async () => {
    if (action.id !== 'call' || !targetContactName) {
      return;
    }

    setIsFetchingContacts(true);
    setCallStatus(null);

    try {
      const permission = await Contacts.requestPermissionsAsync();

      if (permission.status !== 'granted') {
        setCallStatus('Contacts permission denied. Please allow contacts access.');
        setIsFetchingContacts(false);
        return;
      }

      const contactResult = await Contacts.getContactsAsync({
        name: targetContactName,
        fields: [Contacts.Fields.PhoneNumbers],
        pageSize: 200
      });

      const allCandidates = extractContactCandidates(contactResult.data);
      const query = targetContactName.toLowerCase();
      const exactMatches = allCandidates.filter((item) =>
        item.name.toLowerCase().includes(query)
      );

      const finalMatches = (exactMatches.length > 0 ? exactMatches : allCandidates).slice(0, 10);
      setContactMatches(finalMatches);

      if (!selectedNumber && finalMatches.length === 1) {
        setSelectedNumber(finalMatches[0].number);
      }

      if (!route.params.targetPhoneNumber && finalMatches.length === 0) {
        setCallStatus('No phonebook match found. Add number manually in Smart Call form.');
      }
    } catch {
      setCallStatus('Failed to read contacts. Please try again.');
    } finally {
      setIsFetchingContacts(false);
    }
  };

  useEffect(() => {
    void findContactMatches();
    // We only want initial lookup for this screen load context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInitiateCall = async () => {
    if (!dialNumber) {
      setCallStatus('No phone number found. Go back and add contact or number.');
      return;
    }

    const callUrl = `tel:${dialNumber}`;
    const dialUrl = `tel:${dialNumber}`;

    try {
      if (Platform.OS === 'android') {
        const permission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CALL_PHONE,
          {
            title: 'Call permission',
            message: 'My Phone Agent needs permission to place direct smart calls.',
            buttonPositive: 'Allow',
            buttonNegative: 'Not now'
          }
        );

        if (permission === PermissionsAndroid.RESULTS.GRANTED) {
          await IntentLauncher.startActivityAsync('android.intent.action.CALL', {
            data: callUrl
          });
          setCallStatus(`Direct call started for ${dialNumber}`);
          return;
        }
      }

      const supported = await Linking.canOpenURL(dialUrl);
      if (!supported) {
        setCallStatus('Calling is not supported on this device.');
        return;
      }

      await Linking.openURL(dialUrl);
      setCallStatus(`Dialer opened for ${dialNumber}`);
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

          {targetContactName ? (
            <AppText muted>Searching phonebook for: {targetContactName}</AppText>
          ) : null}

          {dialNumber ? <AppText muted>Selected number: {dialNumber}</AppText> : null}

          {isFetchingContacts ? <AppText muted>Loading phonebook contacts...</AppText> : null}

          {contactMatches.length > 0 ? (
            <View style={styles.contactList}>
              {contactMatches.map((candidate) => {
                const isSelected = dialNumber === candidate.number;

                return (
                  <Pressable
                    key={candidate.id}
                    onPress={() => setSelectedNumber(candidate.number)}
                    style={[
                      styles.contactRow,
                      {
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        backgroundColor: isSelected
                          ? theme.colors.surfaceAlt
                          : theme.colors.surface
                      }
                    ]}
                  >
                    <View style={styles.contactMeta}>
                      <AppText style={styles.contactName}>{candidate.name}</AppText>
                      <AppText muted style={styles.contactNumber}>
                        {candidate.number}
                      </AppText>
                    </View>
                    <AppText>{isSelected ? 'Selected' : 'Choose'}</AppText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.callActionRow}>
            <Button
              label="Refresh Contacts"
              variant="secondary"
              fullWidth={false}
              style={styles.halfButton}
              onPress={() => {
                void findContactMatches();
              }}
            />
            <Button
              label="Start Smart Call"
              fullWidth={false}
              style={styles.halfButton}
              onPress={() => {
                void handleInitiateCall();
              }}
              disabled={!dialNumber}
            />
          </View>

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
  contactList: {
    gap: 8,
    marginTop: 2
  },
  contactRow: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  contactMeta: {
    flex: 1,
    gap: 1
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700'
  },
  contactNumber: {
    fontSize: 12
  },
  callActionRow: {
    flexDirection: 'row',
    gap: 10
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
