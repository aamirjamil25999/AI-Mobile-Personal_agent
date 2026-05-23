import React from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle
} from 'react-native';

import { AppText } from '@/components/ui/Text';
import { useAppTheme } from '@/theme/useAppTheme';

type InputProps = TextInputProps & {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
};

export const Input = ({ label, error, containerStyle, style, ...rest }: InputProps) => {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      <AppText style={styles.label}>{label}</AppText>
      <TextInput
        placeholderTextColor={theme.colors.placeholder}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.inputBackground,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            color: theme.colors.text,
            borderRadius: theme.radius.md
          },
          style
        ]}
        {...rest}
      />
      {error ? (
        <AppText style={[styles.error, { color: theme.colors.danger }]}>{error}</AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 12
  },
  label: {
    marginBottom: 6,
    fontWeight: '600'
  },
  input: {
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 12,
    fontSize: 16
  },
  error: {
    marginTop: 6,
    fontSize: 12
  }
});
