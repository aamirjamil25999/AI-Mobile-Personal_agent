import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { AppText } from '@/components/ui/Text';
import { useSignupWithEmailMutation } from '@/features/auth/api/authApi';
import { setCredentials } from '@/features/auth/slices/authSlice';
import type { EmailSignupInput } from '@/features/auth/types/auth';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useAppDispatch } from '@/store/hooks';
import { useAppTheme } from '@/theme/useAppTheme';
import { emailSignupSchema } from '@/utils/validators';

type SignupScreenProps = NativeStackScreenProps<RootStackParamList, 'Signup'>;

type SignupFormValues = EmailSignupInput & {
  confirmPassword: string;
};

export const SignupScreen = ({ navigation }: SignupScreenProps) => {
  const theme = useAppTheme();
  const dispatch = useAppDispatch();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [signupWithEmail, { isLoading }] = useSignupWithEmailMutation();

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<SignupFormValues>({
    resolver: zodResolver(emailSignupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const handleCreateAccount = handleSubmit(async (values) => {
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

  return (
    <ScreenContainer>
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
        <AppText style={styles.title}>Create Your Account</AppText>
        <AppText muted style={styles.subtitle}>
          Sign up to start your secure phone agent workspace.
        </AppText>

        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Full Name (optional)"
              value={value ?? ''}
              autoCapitalize="words"
              onChangeText={onChange}
              error={errors.fullName?.message}
            />
          )}
        />

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

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <PasswordInput
              label="Confirm Password"
              value={value}
              onChangeText={onChange}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <AppText muted style={styles.passwordHint}>
          Use 10+ chars with uppercase, lowercase, number, and special symbol.
        </AppText>

        <Button label="Create Account" onPress={handleCreateAccount} isLoading={isLoading} />
        <Button
          label="Already have an account? Sign In"
          variant="secondary"
          onPress={() => navigation.navigate('Login')}
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
    padding: 18,
    gap: 8
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800'
  },
  subtitle: {
    marginBottom: 8
  },
  passwordHint: {
    fontSize: 12,
    marginTop: -4,
    marginBottom: 8
  },
  status: {
    marginTop: 4,
    fontSize: 13
  }
});
