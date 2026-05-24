import React from 'react';
import { Text as RNText, StyleSheet, type TextProps } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';

type AppTextProps = TextProps & {
  muted?: boolean;
};

export const AppText = ({ muted = false, style, ...rest }: AppTextProps) => {
  const theme = useAppTheme();

  return (
    <RNText
      style={[styles.text, { color: muted ? theme.colors.textMuted : theme.colors.text }, style]}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    lineHeight: 20
  }
});
