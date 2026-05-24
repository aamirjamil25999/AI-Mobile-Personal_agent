import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AppText } from '@/components/ui/Text';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useAppTheme } from '@/theme/useAppTheme';

type ForgotPasswordScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ForgotPassword'
>;

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email')
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordScreen = ({ navigation }: ForgotPasswordScreenProps) => {
  const theme = useAppTheme();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  const handleSendReset = handleSubmit(async ({ email }) => {
    setStatusMessage(null);
    setIsSubmitting(true);

    // Backend reset endpoint is not live yet, so we keep a safe UX response.
    await new Promise((resolve) => setTimeout(resolve, 500));

    setIsSubmitting(false);
    setStatusMessage(`If ${email} exists, reset instructions have been sent.`);
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
        <AppText style={styles.title}>Reset Password</AppText>
        <AppText muted style={styles.subtitle}>
          Enter your email and we will send password reset instructions.
        </AppText>

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

        <Button label="Send Reset Link" onPress={handleSendReset} isLoading={isSubmitting} />
        <Button
          label="Back To Sign In"
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
    gap: 10
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800'
  },
  subtitle: {
    marginBottom: 8
  },
  status: {
    marginTop: 4,
    fontSize: 13
  }
});
