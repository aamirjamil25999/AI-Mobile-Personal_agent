import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
  useSignupWithEmailMutation,
  useVerifyPhoneOtpMutation
} from '@/features/auth/api/authApi';
import { setCredentials } from '@/features/auth/slices/authSlice';
import type { EmailLoginInput, EmailSignupInput } from '@/features/auth/types/auth';
import { toggleThemeMode } from '@/features/theme/slices/themeSlice';
import { useAppDispatch } from '@/store/hooks';
import { useAppTheme } from '@/theme/useAppTheme';
import {
  emailLoginSchema,
  emailSignupSchema,
  otpSchema,
  phoneSchema
} from '@/utils/validators';

WebBrowser.maybeCompleteAuthSession();

type LoginMode = 'email' | 'phone' | 'google';
type EmailMode = 'signin' | 'signup';

type EmailSignupFormValues = EmailSignupInput & {
  confirmPassword: string;
};

const GOOGLE_CLIENT_PLACEHOLDER =
  '000000000000-placeholderplaceholderplaceholder.apps.googleusercontent.com';

const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

const hasGoogleConfig = Boolean(
  googleIosClientId || googleAndroidClientId || googleWebClientId
);

const normalizePhoneNumber = (value: string) => value.replace(/[^\d]/g, '').slice(0, 15);
const normalizeOtp = (value: string) => value.replace(/[^\d]/g, '').slice(0, 6);

export const LoginScreen = () => {
  const theme = useAppTheme();
  const dispatch = useAppDispatch();

  const [mode, setMode] = useState<LoginMode>('email');
  const [emailMode, setEmailMode] = useState<EmailMode>('signin');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [signupWithEmail, { isLoading: isSignupLoading }] = useSignupWithEmailMutation();
  const [loginWithEmail, { isLoading: isEmailLoading }] = useLoginWithEmailMutation();
  const [requestPhoneOtp, { isLoading: isPhoneRequestLoading }] =
    useRequestPhoneOtpMutation();
  const [verifyPhoneOtp, { isLoading: isPhoneVerifyLoading }] =
    useVerifyPhoneOtpMutation();
  const [loginWithGoogle, { isLoading: isGoogleLoading }] = useLoginWithGoogleMutation();

  const {
    control: loginControl,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors }
  } = useForm<EmailLoginInput>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const {
    control: signupControl,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors }
  } = useForm<EmailSignupFormValues>({
    resolver: zodResolver(emailSignupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId:
      googleIosClientId ?? googleWebClientId ?? googleAndroidClientId ?? GOOGLE_CLIENT_PLACEHOLDER,
    androidClientId:
      googleAndroidClientId ?? googleWebClientId ?? googleIosClientId ?? GOOGLE_CLIENT_PLACEHOLDER,
    webClientId:
      googleWebClientId ?? googleAndroidClientId ?? googleIosClientId ?? GOOGLE_CLIENT_PLACEHOLDER
  });

  useEffect(() => {
    const completeGoogleSignIn = async () => {
      if (response?.type !== 'success') {
        return;
      }

      const idToken = response.authentication?.idToken;
      if (!idToken) {
        setStatusMessage('Google token missing, try again.');
        return;
      }

      try {
        const auth = await loginWithGoogle({ idToken }).unwrap();
        dispatch(setCredentials(auth));
        setStatusMessage('Signed in with Google');
      } catch {
        setStatusMessage('Google login failed.');
      }
    };

    void completeGoogleSignIn();
  }, [dispatch, loginWithGoogle, response]);

  useEffect(() => {
    setStatusMessage(null);
    if (mode !== 'phone') {
      setOtp('');
      setOtpSent(false);
      setPhoneNumber('');
    }
  }, [mode]);

  const handleEmailLogin = handleLoginSubmit(async (values) => {
    setStatusMessage(null);
    try {
      const auth = await loginWithEmail(values).unwrap();
      dispatch(setCredentials(auth));
      setStatusMessage('Email login successful');
    } catch {
      setStatusMessage('Email login failed. Check credentials.');
    }
  });

  const handleEmailSignup = handleSignupSubmit(async (values) => {
    setStatusMessage(null);

    try {
      const auth = await signupWithEmail({
        fullName: values.fullName?.trim() ? values.fullName.trim() : undefined,
        email: values.email,
        password: values.password
      }).unwrap();

      dispatch(setCredentials(auth));
      setStatusMessage('Account created successfully');
    } catch {
      setStatusMessage('Signup failed. Try a different email.');
    }
  });

  const handleSendOtp = async () => {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const parsed = phoneSchema.safeParse({ phoneNumber: normalizedPhone });
    if (!parsed.success) {
      setStatusMessage(parsed.error.issues[0]?.message ?? 'Enter a valid phone number.');
      return;
    }

    try {
      const otpResponse = await requestPhoneOtp({
        phoneNumber: normalizedPhone
      }).unwrap();
      setOtpSent(true);
      setPhoneNumber(normalizedPhone);
      setOtp(otpResponse.otp ?? '');
      setStatusMessage(
        otpResponse.otp
          ? `OTP sent. Dev OTP: ${otpResponse.otp}`
          : 'OTP sent. Check your SMS provider delivery status.'
      );
    } catch {
      setStatusMessage('Failed to send OTP.');
    }
  };

  const handleVerifyOtp = async () => {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const normalizedOtp = normalizeOtp(otp);
    const parsed = otpSchema.safeParse({ otp: normalizedOtp });
    if (!parsed.success) {
      setStatusMessage(parsed.error.issues[0]?.message ?? 'OTP must be 6 digits.');
      return;
    }

    try {
      const auth = await verifyPhoneOtp({
        phoneNumber: normalizedPhone,
        otp: normalizedOtp
      }).unwrap();
      dispatch(setCredentials(auth));
      setStatusMessage('Phone login successful');
    } catch {
      setStatusMessage('OTP verification failed.');
    }
  };

  const handleGooglePress = async () => {
    if (!hasGoogleConfig) {
      setStatusMessage('Google login is not configured yet. Add client IDs in frontend .env.');
      return;
    }

    if (!request) {
      setStatusMessage('Google auth is initializing. Try again in a moment.');
      return;
    }

    await promptAsync();
  };

  const modeLabel = useMemo(() => {
    if (mode === 'email') {
      return emailMode === 'signin' ? 'Email Sign In' : 'Email Sign Up';
    }
    if (mode === 'phone') {
      return 'Phone + OTP';
    }
    return 'Google OAuth';
  }, [mode, emailMode]);

  return (
    <ScreenContainer>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border }
        ]}
      >
        <AppText style={styles.title}>My Phone Agent</AppText>
        <AppText muted style={styles.subtitle}>
          Secure auth with {modeLabel}
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
          <>
            <View style={styles.modeRow}>
              <Button
                label="Sign In"
                variant={emailMode === 'signin' ? 'primary' : 'secondary'}
                fullWidth={false}
                onPress={() => setEmailMode('signin')}
                style={styles.modeButton}
              />
              <Button
                label="Sign Up"
                variant={emailMode === 'signup' ? 'primary' : 'secondary'}
                fullWidth={false}
                onPress={() => setEmailMode('signup')}
                style={styles.modeButton}
              />
            </View>

            {emailMode === 'signin' ? (
              <View>
                <Controller
                  control={loginControl}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Email"
                      value={value}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      onChangeText={onChange}
                      error={loginErrors.email?.message}
                    />
                  )}
                />
                <Controller
                  control={loginControl}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <PasswordInput
                      label="Password"
                      value={value}
                      onChangeText={onChange}
                      error={loginErrors.password?.message}
                    />
                  )}
                />
                <Button label="Login" onPress={handleEmailLogin} isLoading={isEmailLoading} />
              </View>
            ) : (
              <View>
                <Controller
                  control={signupControl}
                  name="fullName"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Full Name (optional)"
                      value={value ?? ''}
                      autoCapitalize="words"
                      onChangeText={onChange}
                      error={signupErrors.fullName?.message}
                    />
                  )}
                />
                <Controller
                  control={signupControl}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Email"
                      value={value}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      onChangeText={onChange}
                      error={signupErrors.email?.message}
                    />
                  )}
                />
                <Controller
                  control={signupControl}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <PasswordInput
                      label="Password"
                      value={value}
                      onChangeText={onChange}
                      error={signupErrors.password?.message}
                    />
                  )}
                />
                <Controller
                  control={signupControl}
                  name="confirmPassword"
                  render={({ field: { onChange, value } }) => (
                    <PasswordInput
                      label="Confirm Password"
                      value={value}
                      onChangeText={onChange}
                      error={signupErrors.confirmPassword?.message}
                    />
                  )}
                />
                <AppText muted style={styles.passwordHint}>
                  Use 10+ chars with uppercase, lowercase, number, and special symbol.
                </AppText>
                <Button
                  label="Create Account"
                  onPress={handleEmailSignup}
                  isLoading={isSignupLoading}
                />
              </View>
            )}
          </>
        ) : null}

        {mode === 'phone' ? (
          <View>
            <Input
              label="Phone Number"
              placeholder="9876543210"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={(value) => setPhoneNumber(normalizePhoneNumber(value))}
            />
            {otpSent ? (
              <Input
                label="OTP"
                placeholder="6 digit OTP"
                keyboardType="number-pad"
                value={otp}
                onChangeText={(value) => setOtp(normalizeOtp(value))}
              />
            ) : null}
            {!otpSent ? (
              <Button label="Send OTP" onPress={handleSendOtp} isLoading={isPhoneRequestLoading} />
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
            <Button
              label={hasGoogleConfig ? 'Continue with Google' : 'Google Not Configured'}
              onPress={() => void handleGooglePress()}
              isLoading={isGoogleLoading}
              disabled={!hasGoogleConfig}
            />
            {!hasGoogleConfig ? (
              <AppText muted style={styles.googleHint}>
                Add Google client IDs in `frontend/.env` to enable this.
              </AppText>
            ) : null}
          </View>
        ) : null}

        <Button
          label="Toggle Theme"
          variant="ghost"
          onPress={() => dispatch(toggleThemeMode())}
          style={styles.themeButton}
        />

        {statusMessage ? (
          <AppText style={[styles.status, { color: theme.colors.textMuted }]}>{statusMessage}</AppText>
        ) : null}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 12
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34
  },
  subtitle: {
    marginBottom: 6
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4
  },
  modeButton: {
    flex: 1
  },
  resendButton: {
    marginTop: 10
  },
  themeButton: {
    marginTop: 8
  },
  passwordHint: {
    fontSize: 12,
    marginTop: -4,
    marginBottom: 10
  },
  googleHint: {
    marginTop: 10,
    fontSize: 12
  },
  status: {
    marginTop: 4,
    fontSize: 13
  }
});
