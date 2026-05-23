import React, { type PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, type ViewStyle } from 'react-native';

import { SafeAreaLayout } from '@/components/layout/SafeAreaLayout';
import { useAppTheme } from '@/theme/useAppTheme';

type ScreenContainerProps = PropsWithChildren<{
  contentStyle?: ViewStyle;
}>;

export const ScreenContainer = ({ children, contentStyle }: ScreenContainerProps) => {
  const theme = useAppTheme();

  return (
    <SafeAreaLayout>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { backgroundColor: theme.colors.background },
          contentStyle
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 20
  }
});
