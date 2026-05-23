import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAppTheme } from '@/theme/useAppTheme';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const HomeScreen = () => {
  const theme = useAppTheme();
  const { user, logout } = useAuth();

  return (
    <View style={[styles.home, { backgroundColor: theme.colors.background }]}> 
      <AppText style={styles.homeTitle}>Welcome, {user?.fullName ?? 'Agent User'}</AppText>
      <AppText muted style={styles.homeSub}>You are logged in and ready to automate.</AppText>
      <Button label="Logout" variant="secondary" onPress={() => void logout()} />
    </View>
  );
};

export const RootNavigator = () => {
  const theme = useAppTheme();
  const isAuthenticated = useAuth().isAuthenticated;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        contentStyle: { backgroundColor: theme.colors.background }
      }}
    >
      {isAuthenticated ? (
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'My Phone Agent' }} />
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Sign In', headerBackVisible: false }}
        />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  home: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    gap: 12
  },
  homeTitle: {
    fontSize: 24,
    fontWeight: '700'
  },
  homeSub: {
    marginBottom: 8
  }
});
