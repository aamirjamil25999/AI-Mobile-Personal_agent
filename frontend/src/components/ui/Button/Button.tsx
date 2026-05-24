import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle
} from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = PressableProps & {
  label: string;
  isLoading?: boolean;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const Button = ({
  label,
  isLoading = false,
  variant = 'primary',
  fullWidth = true,
  disabled,
  style,
  ...rest
}: ButtonProps) => {
  const theme = useAppTheme();

  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary
    },
    secondary: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.border
    },
    danger: {
      backgroundColor: theme.colors.danger,
      borderColor: theme.colors.danger
    }
  };

  const labelColor =
    variant === 'primary' || variant === 'danger' ? theme.colors.primaryText : theme.colors.text;

  return (
    <Pressable
      disabled={Boolean(disabled) || isLoading}
      style={({ pressed }) => [
        styles.button,
        {
          width: fullWidth ? '100%' : undefined,
          opacity: pressed || Boolean(disabled) ? 0.8 : 1,
          borderRadius: theme.radius.md
        },
        variantStyles[variant],
        style
      ]}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={labelColor} size="small" />
      ) : (
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  label: {
    fontSize: 16,
    fontWeight: '700'
  }
});
