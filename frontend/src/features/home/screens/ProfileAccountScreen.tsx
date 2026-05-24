import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toggleThemeMode } from '@/features/theme/slices/themeSlice';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useAppTheme } from '@/theme/useAppTheme';

type ProfileAccountScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ProfileAccount'
>;

const maskUserId = (value: string | undefined) => {
  if (!value) {
    return 'Unavailable';
  }

  if (value.length <= 8) {
    return value;
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

export const ProfileAccountScreen = ({ navigation }: ProfileAccountScreenProps) => {
  const theme = useAppTheme();
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector((state) => state.theme.mode);
  const { user, logout } = useAuth();
  const [status, setStatus] = useState<string | null>(null);

  const userName = useMemo(() => {
    if (user?.fullName?.trim()) {
      return user.fullName.trim();
    }

    if (user?.email) {
      return user.email.split('@')[0];
    }

    if (user?.phoneNumber) {
      return `User ${user.phoneNumber.slice(-4)}`;
    }

    return 'Agent User';
  }, [user]);

  const initials = useMemo(() => {
    const words = userName.split(' ').filter(Boolean);
    if (words.length === 0) {
      return 'U';
    }
    return words
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase() ?? '')
      .join('');
  }, [userName]);

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
        <View style={styles.headerRow}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.border
              }
            ]}
          >
            <AppText style={styles.avatarText}>{initials}</AppText>
          </View>
          <View style={styles.headerMeta}>
            <AppText style={styles.title}>{userName}</AppText>
            <AppText muted style={styles.subtitle}>
              Profile & Account
            </AppText>
          </View>
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
        <AppText style={styles.blockTitle}>Account Details</AppText>
        <AppText muted>Email: {user?.email ?? 'Not set'}</AppText>
        <AppText muted>Phone: {user?.phoneNumber ?? 'Not set'}</AppText>
        <AppText muted>Provider: {user?.provider ?? 'Unknown'}</AppText>
        <AppText muted>Role: {user?.role ?? 'Unknown'}</AppText>
        <AppText muted>User ID: {maskUserId(user?.id)}</AppText>
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
        <AppText style={styles.blockTitle}>Preferences</AppText>
        <AppText muted>Theme mode: {themeMode}</AppText>
        <Button
          label={themeMode === 'dark' ? 'Switch To Light Mode' : 'Switch To Dark Mode'}
          variant="secondary"
          onPress={() => {
            dispatch(toggleThemeMode());
            setStatus(`Theme changed to ${themeMode === 'dark' ? 'light' : 'dark'}.`);
          }}
        />
        <Button
          label="Open Permissions Manager"
          variant="ghost"
          onPress={() => {
            navigation.navigate('PermissionsManager');
          }}
        />
        <Button
          label="Open Agent Settings"
          variant="ghost"
          onPress={() => {
            navigation.navigate('AgentSettings');
          }}
        />
      </View>

      <View style={styles.buttonRow}>
        <Button
          label="Open Execution History"
          variant="ghost"
          fullWidth={false}
          style={styles.halfButton}
          onPress={() => {
            navigation.navigate('ExecutionHistory');
          }}
        />
        <Button
          label="Back To Home"
          variant="secondary"
          fullWidth={false}
          style={styles.halfButton}
          onPress={() => {
            navigation.navigate('Home');
          }}
        />
      </View>

      <Button
        label="Logout"
        onPress={() => {
          void logout();
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  avatar: {
    width: 52,
    height: 52,
    borderWidth: 1,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800'
  },
  headerMeta: {
    flex: 1,
    gap: 2
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800'
  },
  subtitle: {
    fontSize: 12
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10
  },
  halfButton: {
    flex: 1
  }
});
