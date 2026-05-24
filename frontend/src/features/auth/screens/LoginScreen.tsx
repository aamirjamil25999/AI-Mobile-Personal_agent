import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { AppText } from '@/components/ui/Text';
import {
  useLoginWithEmailMutation,
  useLoginWithGoogleMutation,
  useSignupWithEmailMutation
} from '@/features/auth/api/authApi';
import { setCredentials } from '@/features/auth/slices/authSlice';
import type { EmailLoginInput, EmailSignupInput } from '@/features/auth/types/auth';
import { toggleThemeMode } from '@/features/theme/slices/themeSlice';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useAppDispatch } from '@/store/hooks';
import { useAppTheme } from '@/theme/useAppTheme';
import { emailLoginSchema, emailSignupSchema } from '@/utils/validators';

WebBrowser.maybeCompleteAuthSession();

type LoginMode = 'email' | 'google';
type EmailMode = 'signin' | 'signup';

type EmailSignupFormValues = EmailSignupInput & {
  confirmPassword: string;
};
type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

const GOOGLE_CLIENT_PLACEHOLDER =
  '000000000000-placeholderplaceholderplaceholder.apps.googleusercontent.com';

const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

const hasGoogleConfig = Boolean(googleIosClientId || googleAndroidClientId || googleWebClientId);

export const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const theme = useAppTheme();
  const dispatch = useAppDispatch();

  const [mode, setMode] = useState<LoginMode>('email');
  const [emailMode, setEmailMode] = useState<EmailMode>('signin');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [signupWithEmail, { isLoading: isSignupLoading }] = useSignupWithEmailMutation();
  const [loginWithEmail, { isLoading: isEmailLoading }] = useLoginWithEmailMutation();
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

    completeGoogleSignIn();
  }, [dispatch, loginWithGoogle, response]);

  useEffect(() => {
    setStatusMessage(null);
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
            label="Google"
            variant={mode === 'google' ? 'primary' : 'secondary'}
            fullWidth={false}
            onPress={() => setMode('google')}
            style={styles.modeButton}
          />
        </View>
        <AppText muted style={styles.otpPauseHint}>
          Phone OTP login is paused for now. Use Email or Google sign-in.
        </AppText>

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
                <Button
                  label="Open Full Signup Screen"
                  variant="ghost"
                  onPress={() => navigation.navigate('Signup')}
                />
                <Button
                  label="Forgot Password?"
                  variant="ghost"
                  onPress={() => navigation.navigate('ForgotPassword')}
                />
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

        {mode === 'google' ? (
          <View>
            <Button
              label={hasGoogleConfig ? 'Continue with Google' : 'Google Not Configured'}
              onPress={handleGooglePress}
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
          <AppText style={[styles.status, { color: theme.colors.textMuted }]}>
            {statusMessage}
          </AppText>
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
  otpPauseHint: {
    fontSize: 12,
    marginTop: -2
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
