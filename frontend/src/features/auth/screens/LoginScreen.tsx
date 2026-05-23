import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { AppText } from '@/components/ui/Text';
import {
  useLoginWithEmailMutation,
  useLoginWithGoogleMutation,
  useRequestPhoneOtpMutation,
  useVerifyPhoneOtpMutation
} from '@/features/auth/api/authApi';
import { setCredentials } from '@/features/auth/slices/authSlice';
import type { EmailLoginInput } from '@/features/auth/types/auth';
import { toggleThemeMode } from '@/features/theme/slices/themeSlice';
import { secureStorage } from '@/services/secureStorage';
import { useAppDispatch } from '@/store/hooks';
import { useAppTheme } from '@/theme/useAppTheme';
import { emailLoginSchema } from '@/utils/validators';

WebBrowser.maybeCompleteAuthSession();

type LoginMode = 'email' | 'phone' | 'google';

type GoogleAuthCardProps = {
  androidClientId: string;
  iosClientId: string;
  webClientId: string;
  isLoading: boolean;
  onError: (message: string) => void;
  onSuccess: (idToken: string) => Promise<void>;
};

const GoogleAuthCard = ({
  androidClientId,
  iosClientId,
  webClientId,
  isLoading,
  onError,
  onSuccess
}: GoogleAuthCardProps) => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId,
    androidClientId,
    webClientId
  });

  useEffect(() => {
    if (!response) {
      return;
    }

    if (response.type === 'error') {
      onError('Google sign-in cancelled or failed.');
      return;
    }

    if (response.type !== 'success') {
      return;
    }

    const idToken = response.authentication?.idToken;
    if (!idToken) {
      onError('Google token missing, try again.');
      return;
    }

    void onSuccess(idToken);
  }, [onError, onSuccess, response]);

  return (
    <View>
      <Button
        label="Continue with Google"
        onPress={() => void promptAsync()}
        disabled={!request}
        isLoading={isLoading}
      />
      <AppText muted style={styles.note}>
        Use your Google account to sign in.
      </AppText>
    </View>
  );
};

export const LoginScreen = () => {
  const theme = useAppTheme();
  const dispatch = useAppDispatch();

  const [mode, setMode] = useState<LoginMode>('email');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [loginWithEmail, { isLoading: isEmailLoading }] = useLoginWithEmailMutation();
  const [requestPhoneOtp, { isLoading: isPhoneRequestLoading }] =
    useRequestPhoneOtpMutation();
  const [verifyPhoneOtp, { isLoading: isPhoneVerifyLoading }] =
    useVerifyPhoneOtpMutation();
  const [loginWithGoogle, { isLoading: isGoogleLoading }] = useLoginWithGoogleMutation();

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<EmailLoginInput>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const googleClientIds = useMemo(
    () => ({
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? '',
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() ?? '',
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? ''
    }),
    []
  );

  const missingGoogleEnvVar = useMemo(() => {
    if (Platform.OS === 'android') {
      return 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID';
    }

    if (Platform.OS === 'ios') {
      return 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID';
    }

    return 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID';
  }, []);

  const isGoogleConfigured = useMemo(() => {
    if (Platform.OS === 'android') {
      return Boolean(googleClientIds.androidClientId);
    }

    if (Platform.OS === 'ios') {
      return Boolean(googleClientIds.iosClientId);
    }

    return Boolean(googleClientIds.webClientId);
  }, [googleClientIds.androidClientId, googleClientIds.iosClientId, googleClientIds.webClientId]);

  const handleGoogleToken = async (idToken: string) => {
    try {
      const auth = await loginWithGoogle({ idToken }).unwrap();
      await secureStorage.saveTokens(auth.accessToken, auth.refreshToken);
      dispatch(setCredentials(auth));
      setStatusMessage('Signed in with Google');
    } catch {
      setStatusMessage('Google login failed.');
    }
  };

  useEffect(() => {
    setStatusMessage(null);
    if (mode !== 'phone') {
      setOtp('');
      setOtpSent(false);
      setPhoneNumber('');
    }
  }, [mode]);

  const handleEmailLogin = handleSubmit(async (values) => {
    setStatusMessage(null);
    try {
      const auth = await loginWithEmail(values).unwrap();
      await secureStorage.saveTokens(auth.accessToken, auth.refreshToken);
      dispatch(setCredentials(auth));
      setStatusMessage('Email login successful');
    } catch {
      setStatusMessage('Email login failed. Check credentials.');
    }
  });

  const handleSendOtp = async () => {
    if (!/^[0-9]{10,15}$/.test(phoneNumber)) {
      setStatusMessage('Enter valid phone number (10-15 digits).');
      return;
    }

    try {
      await requestPhoneOtp({ phoneNumber }).unwrap();
      setOtpSent(true);
      setOtp('');
      setStatusMessage('OTP sent. Use the OTP shown in backend logs for local testing.');
    } catch {
      setStatusMessage('Failed to send OTP.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^[0-9]{6}$/.test(otp)) {
      setStatusMessage('OTP must be 6 digits.');
      return;
    }

    try {
      const auth = await verifyPhoneOtp({ phoneNumber, otp }).unwrap();
      await secureStorage.saveTokens(auth.accessToken, auth.refreshToken);
      dispatch(setCredentials(auth));
      setStatusMessage('Phone login successful');
    } catch {
      setStatusMessage('OTP verification failed.');
    }
  };

  const modeLabel = useMemo(() => {
    if (mode === 'email') {
      return 'Email + Password';
    }
    if (mode === 'phone') {
      return 'Phone + OTP';
    }
    return 'Google OAuth';
  }, [mode]);

  return (
    <ScreenContainer>
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <AppText style={styles.title}>My Phone Agent</AppText>
        <AppText muted style={styles.subtitle}>
          Secure sign in with {modeLabel}
        </AppText>

        <View style={styles.modeRow}>
          <Button
            label="Email"
            variant={mode === 'email' ? 'primary' : 'secondary'}
            fullWidth={false}
            onPress={() => setMode('email')}
            style={styles.modeButton}
          />
          <Button
            label="Phone"
            variant={mode === 'phone' ? 'primary' : 'secondary'}
            fullWidth={false}
            onPress={() => setMode('phone')}
            style={styles.modeButton}
          />
          <Button
            label="Google"
            variant={mode === 'google' ? 'primary' : 'secondary'}
            fullWidth={false}
            onPress={() => setMode('google')}
            style={styles.modeButton}
          />
        </View>

        {mode === 'email' ? (
          <View>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email"
                  value={value}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onChangeText={onChange}
                  error={errors.email?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <PasswordInput
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  error={errors.password?.message}
                />
              )}
            />
            <Button label="Login" onPress={handleEmailLogin} isLoading={isEmailLoading} />
          </View>
        ) : null}

        {mode === 'phone' ? (
          <View>
            <Input
              label="Phone Number"
              placeholder="9876543210"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
            {otpSent ? (
              <Input
                label="OTP"
                placeholder="6 digit OTP"
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
              />
            ) : null}
            {!otpSent ? (
              <Button
                label="Send OTP"
                onPress={handleSendOtp}
                isLoading={isPhoneRequestLoading}
              />
            ) : (
              <>
                <Button
                  label="Verify OTP"
                  onPress={handleVerifyOtp}
                  isLoading={isPhoneVerifyLoading}
                />
                <Button
                  label="Resend OTP"
                  variant="ghost"
                  onPress={handleSendOtp}
                  isLoading={isPhoneRequestLoading}
                  style={styles.resendButton}
                />
              </>
            )}
          </View>
        ) : null}

        {mode === 'google' ? (
          <View>
            {isGoogleConfigured ? (
              <GoogleAuthCard
                iosClientId={googleClientIds.iosClientId}
                androidClientId={googleClientIds.androidClientId}
                webClientId={googleClientIds.webClientId}
                isLoading={isGoogleLoading}
                onError={setStatusMessage}
                onSuccess={handleGoogleToken}
              />
            ) : (
              <AppText muted style={styles.note}>
                Google login config missing. Add {missingGoogleEnvVar} in frontend `.env`.
              </AppText>
            )}
          </View>
        ) : null}

        {statusMessage ? (
          <AppText style={[styles.status, { color: theme.colors.textMuted }]}>{statusMessage}</AppText>
        ) : null}

        <Button
          label="Toggle Theme"
          variant="ghost"
          onPress={() => dispatch(toggleThemeMode())}
          style={styles.themeButton}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 16,
    borderRadius: 18,
    marginTop: 24
  },
  title: {
    fontSize: 28,
    fontWeight: '800'
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 14
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  modeButton: {
    flex: 1,
    minHeight: 42
  },
  note: {
    marginTop: 8,
    fontSize: 12
  },
  status: {
    marginTop: 14
  },
  themeButton: {
    marginTop: 20
  },
  resendButton: {
    marginTop: 10
  }
});
