import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import type { QuickActionId } from '@/features/home/types/home';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ActionCenterScreen } from '@/features/home/screens/ActionCenterScreen';
import { ExecutionStatusScreen } from '@/features/home/screens/ExecutionStatusScreen';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { TaskReviewScreen } from '@/features/home/screens/TaskReviewScreen';
import { useAppTheme } from '@/theme/useAppTheme';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  ActionCenter: {
    actionId: QuickActionId;
  };
  TaskReview: {
    actionId: QuickActionId;
    prompt: string;
    targetContactName?: string;
    targetPhoneNumber?: string;
  };
  ExecutionStatus: {
    actionId: QuickActionId;
    prompt: string;
    safetyCount: number;
    targetContactName?: string;
    targetPhoneNumber?: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

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
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'My Phone Agent' }}
          />
          <Stack.Screen
            name="ActionCenter"
            component={ActionCenterScreen}
            options={{ title: 'Action Center' }}
          />
          <Stack.Screen
            name="TaskReview"
            component={TaskReviewScreen}
            options={{ title: 'Task Review' }}
          />
          <Stack.Screen
            name="ExecutionStatus"
            component={ExecutionStatusScreen}
            options={{ title: 'Execution Status' }}
          />
        </>
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
