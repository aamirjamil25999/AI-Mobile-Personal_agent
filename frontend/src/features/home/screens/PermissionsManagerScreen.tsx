import React, { useEffect, useState } from 'react';
import { Linking, PermissionsAndroid, Platform, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Contacts from 'expo-contacts';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useAppTheme } from '@/theme/useAppTheme';

type PermissionsManagerScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'PermissionsManager'
>;

type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable';

const getStatusLabel = (status: PermissionState) => {
  if (status === 'granted') {
    return 'Granted';
  }
  if (status === 'denied') {
    return 'Denied';
  }
  if (status === 'undetermined') {
    return 'Not Requested';
  }
  return 'Unavailable';
};

const mapExpoStatus = (status: string): PermissionState => {
  if (status === 'granted') {
    return 'granted';
  }
  if (status === 'denied') {
    return 'denied';
  }
  return 'undetermined';
};

export const PermissionsManagerScreen = ({ navigation }: PermissionsManagerScreenProps) => {
  const theme = useAppTheme();
  const [contactsStatus, setContactsStatus] = useState<PermissionState>('undetermined');
  const [callStatus, setCallStatus] = useState<PermissionState>(
    Platform.OS === 'android' ? 'undetermined' : 'unavailable'
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const refreshPermissions = async () => {
    setStatusMessage(null);

    try {
      const contactsPermission = await Contacts.getPermissionsAsync();
      setContactsStatus(mapExpoStatus(contactsPermission.status));

      if (Platform.OS === 'android') {
        const hasCallPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.CALL_PHONE
        );
        setCallStatus(hasCallPermission ? 'granted' : 'denied');
      } else {
        setCallStatus('unavailable');
      }
    } catch {
      setStatusMessage('Failed to read permission status.');
    }
  };

  useEffect(() => {
    void refreshPermissions();
  }, []);

  const requestContactsPermission = async () => {
    setStatusMessage(null);
    try {
      const permission = await Contacts.requestPermissionsAsync();
      const mapped = mapExpoStatus(permission.status);
      setContactsStatus(mapped);
      setStatusMessage(`Contacts permission: ${getStatusLabel(mapped)}`);
    } catch {
      setStatusMessage('Failed to request contacts permission.');
    }
  };

  const requestCallPermission = async () => {
    if (Platform.OS !== 'android') {
      setCallStatus('unavailable');
      setStatusMessage('Direct call permission is Android-only in this flow.');
      return;
    }

    setStatusMessage(null);
    try {
      const permission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CALL_PHONE,
        {
          title: 'Call permission',
          message: 'Allow call permission so Smart Call can start direct call.',
          buttonPositive: 'Allow',
          buttonNegative: 'Not now'
        }
      );

      const mapped: PermissionState =
        permission === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
      setCallStatus(mapped);
      setStatusMessage(`Call permission: ${getStatusLabel(mapped)}`);
    } catch {
      setStatusMessage('Failed to request call permission.');
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
        <AppText style={styles.title}>Permissions Manager</AppText>
        <AppText muted style={styles.subtitle}>
          Manage required permissions for Smart Call and automation safety.
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
        <AppText style={styles.blockTitle}>Contacts Access</AppText>
        <AppText muted>Status: {getStatusLabel(contactsStatus)}</AppText>
        <AppText muted style={styles.hint}>
          Needed to find phonebook contacts before placing calls.
        </AppText>
        <Button
          label="Request Contacts Permission"
          variant="secondary"
          onPress={() => {
            void requestContactsPermission();
          }}
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
        <AppText style={styles.blockTitle}>Direct Call Access</AppText>
        <AppText muted>Status: {getStatusLabel(callStatus)}</AppText>
        <AppText muted style={styles.hint}>
          Android only: needed to place direct calls from Smart Call flow.
        </AppText>
        <Button
          label="Request Call Permission"
          variant="secondary"
          onPress={() => {
            void requestCallPermission();
          }}
          disabled={Platform.OS !== 'android'}
        />
      </View>

      <View style={styles.buttonRow}>
        <Button
          label="Refresh Status"
          variant="ghost"
          fullWidth={false}
          style={styles.halfButton}
          onPress={() => {
            void refreshPermissions();
          }}
        />
        <Button
          label="Open Device Settings"
          variant="secondary"
          fullWidth={false}
          style={styles.halfButton}
          onPress={() => {
            void Linking.openSettings();
          }}
        />
      </View>

      <Button
        label="Back To Profile"
        onPress={() => {
          navigation.navigate('ProfileAccount');
        }}
      />

      {statusMessage ? (
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
          <AppText muted>{statusMessage}</AppText>
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
  blockTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  hint: {
    fontSize: 12,
    lineHeight: 17
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10
  },
  halfButton: {
    flex: 1
  }
});
