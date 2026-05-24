import Constants from 'expo-constants';
import { Platform } from 'react-native';

const baseFromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

const resolveAndroidLanBaseUrl = () => {
  if (Platform.OS !== 'android') {
    return null;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) {
    return null;
  }

  const host = hostUri.split(':')[0]?.trim();
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return null;
  }

  return `http://${host}:3000/api`;
};

const defaultBaseUrl =
  resolveAndroidLanBaseUrl() ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api');

export const API_BASE_URL = (baseFromEnv ?? defaultBaseUrl).replace(/\/+$/, '');

export const API_ENDPOINTS = {
  auth: {
    emailSignup: '/auth/email/signup',
    emailLogin: '/auth/email/login',
    requestPhoneOtp: '/auth/phone/request-otp',
    verifyPhoneOtp: '/auth/phone/verify-otp',
    googleLogin: '/auth/google',
    forgotPassword: '/auth/password/forgot',
    resetPassword: '/auth/password/reset',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me'
  },
  workspace: {
    profile: '/workspace/profile',
    permissions: '/workspace/permissions',
    agentSettings: '/workspace/agent-settings',
    agentExecute: '/workspace/agent/execute',
    executions: '/workspace/executions',
    executionHistory: '/workspace/executions/history',
    executionById: (runId: string) => `/workspace/executions/${runId}`,
    executionAudits: (runId: string) => `/workspace/executions/${runId}/audits`,
    followUpTemplates: '/workspace/followups/templates',
    followUpInbox: '/workspace/followups/inbox',
    followUps: '/workspace/followups',
    followUpStatus: (followUpId: string) => `/workspace/followups/${followUpId}/status`,
    followUpSnooze: (followUpId: string) => `/workspace/followups/${followUpId}/snooze`
  }
} as const;
