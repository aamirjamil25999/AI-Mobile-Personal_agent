import React, { type PropsWithChildren } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';

export const SafeAreaLayout = ({ children }: PropsWithChildren) => {
  const theme = useAppTheme();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1
  }
});
