import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { useAppTheme } from '@/theme/useAppTheme';

type PasswordInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  error?: string;
};

export const PasswordInput = ({
  value,
  onChangeText,
  label = 'Password',
  error
}: PasswordInputProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const theme = useAppTheme();

  return (
    <View>
      <Input
        label={label}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!isVisible}
        autoCapitalize="none"
        autoCorrect={false}
        error={error}
      />
      <Pressable onPress={() => setIsVisible((prev) => !prev)} style={styles.toggle}>
        <AppText style={{ color: theme.colors.primary, fontWeight: '600' }}>
          {isVisible ? 'Hide' : 'Show'}
        </AppText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  toggle: {
    alignSelf: 'flex-end',
    marginTop: -6,
    marginBottom: 12
  }
});
