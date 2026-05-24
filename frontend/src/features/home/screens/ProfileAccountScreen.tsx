import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AppText } from '@/components/ui/Text';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { setUser } from '@/features/auth/slices/authSlice';
import { toggleThemeMode } from '@/features/theme/slices/themeSlice';
import {
  useGetProfileQuery,
  useUpdateProfileMutation
} from '@/features/workspace/api/workspaceApi';
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
  const { data: profileData, isFetching, refetch } = useGetProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [status, setStatus] = useState<string | null>(null);

  const sourceUser = profileData?.user ?? user;
  const [fullNameDraft, setFullNameDraft] = useState(sourceUser?.fullName ?? '');

  useEffect(() => {
    setFullNameDraft(sourceUser?.fullName ?? '');
  }, [sourceUser?.fullName]);

  const userName = useMemo(() => {
    if (sourceUser?.fullName?.trim()) {
      return sourceUser.fullName.trim();
    }

    if (sourceUser?.email) {
      return sourceUser.email.split('@')[0];
    }

    if (sourceUser?.phoneNumber) {
      return `User ${sourceUser.phoneNumber.slice(-4)}`;
    }

    return 'Agent User';
  }, [sourceUser?.email, sourceUser?.fullName, sourceUser?.phoneNumber]);

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

  const handleSaveProfile = async () => {
    const trimmed = fullNameDraft.trim();

    if (!trimmed) {
      setStatus('Full name blank nahi hona chahiye.');
      return;
    }

    try {
      const response = await updateProfile({ fullName: trimmed }).unwrap();
      dispatch(setUser(response.user));
      setStatus('Profile updated successfully.');
      await refetch();
    } catch {
      setStatus('Profile update failed. Backend check karke phir try karo.');
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
            {isFetching ? (
              <AppText muted style={styles.subtitle}>
                Syncing profile...
              </AppText>
            ) : null}
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
        <AppText muted>Email: {sourceUser?.email ?? 'Not set'}</AppText>
        <AppText muted>Phone: {sourceUser?.phoneNumber ?? 'Not set'}</AppText>
        <AppText muted>Provider: {sourceUser?.provider ?? 'Unknown'}</AppText>
        <AppText muted>Role: {sourceUser?.role ?? 'Unknown'}</AppText>
        <AppText muted>User ID: {maskUserId(sourceUser?.id)}</AppText>
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
        <AppText style={styles.blockTitle}>Profile Update</AppText>
        <Input
          label="Full Name"
          value={fullNameDraft}
          onChangeText={setFullNameDraft}
          placeholder="Enter your full name"
          autoCapitalize="words"
        />
        <View style={styles.buttonRow}>
          <Button
            label="Save Name"
            variant="secondary"
            fullWidth={false}
            style={styles.halfButton}
            onPress={() => {
              void handleSaveProfile();
            }}
            isLoading={isSaving}
          />
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
