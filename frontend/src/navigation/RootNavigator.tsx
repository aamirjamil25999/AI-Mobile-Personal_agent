import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { SignupScreen } from '@/features/auth/screens/SignupScreen';
import { ForgotPasswordScreen } from '@/features/auth/screens/ForgotPasswordScreen';
import type { QuickActionId } from '@/features/home/types/home';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ActionCenterScreen } from '@/features/home/screens/ActionCenterScreen';
import { ExecutionAuditScreen } from '@/features/home/screens/ExecutionAuditScreen';
import { ExecutionHistoryScreen } from '@/features/home/screens/ExecutionHistoryScreen';
import { RunDetailInsightsScreen } from '@/features/home/screens/RunDetailInsightsScreen';
import { FollowUpPlannerScreen } from '@/features/home/screens/FollowUpPlannerScreen';
import { FollowUpTemplatesScreen } from '@/features/home/screens/FollowUpTemplatesScreen';
import { ExecutionStatusScreen } from '@/features/home/screens/ExecutionStatusScreen';
import { ExecutionSummaryScreen } from '@/features/home/screens/ExecutionSummaryScreen';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { TaskReviewScreen } from '@/features/home/screens/TaskReviewScreen';
import { useAppTheme } from '@/theme/useAppTheme';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
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
  ExecutionSummary: {
    actionId: QuickActionId;
    prompt: string;
    safetyCount: number;
    finalStepIndex: number;
    targetContactName?: string;
    targetPhoneNumber?: string;
    callStatus?: string;
  };
  ExecutionAudit: {
    actionId: QuickActionId;
    prompt: string;
    safetyCount: number;
    targetContactName?: string;
    targetPhoneNumber?: string;
    callStatus?: string;
    executedAt: string;
  };
  ExecutionHistory: undefined;
  RunDetailInsights: {
    runId: string;
    actionId: QuickActionId;
    prompt: string;
    executedAt: string;
    safetyCount: number;
    status: 'success' | 'attention';
    targetContactName?: string;
    targetPhoneNumber?: string;
    callStatus?: string;
  };
  FollowUpPlanner: {
    runId: string;
    actionId: QuickActionId;
    prompt: string;
    targetContactName?: string;
    targetPhoneNumber?: string;
    prefillSlotId?: string;
    prefillChannel?: 'notification' | 'message' | 'email';
    prefillNote?: string;
  };
  FollowUpTemplates: {
    runId: string;
    actionId: QuickActionId;
    prompt: string;
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
          <Stack.Screen
            name="ExecutionSummary"
            component={ExecutionSummaryScreen}
            options={{ title: 'Execution Summary' }}
          />
          <Stack.Screen
            name="ExecutionAudit"
            component={ExecutionAuditScreen}
            options={{ title: 'Execution Audit Log' }}
          />
          <Stack.Screen
            name="ExecutionHistory"
            component={ExecutionHistoryScreen}
            options={{ title: 'Execution History' }}
          />
          <Stack.Screen
            name="RunDetailInsights"
            component={RunDetailInsightsScreen}
            options={{ title: 'Run Detail Insights' }}
          />
          <Stack.Screen
            name="FollowUpPlanner"
            component={FollowUpPlannerScreen}
            options={{ title: 'Follow-up Planner' }}
          />
          <Stack.Screen
            name="FollowUpTemplates"
            component={FollowUpTemplatesScreen}
            options={{ title: 'Follow-up Templates' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Sign In', headerBackVisible: false }}
          />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{ title: 'Create Account' }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ title: 'Forgot Password' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
