import { Platform } from 'react-native';

const baseFromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

const defaultBaseUrl =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api'
    : 'http://localhost:3000/api';

export const API_BASE_URL = (baseFromEnv ?? defaultBaseUrl).replace(/\/+$/, '');

export const API_ENDPOINTS = {
  auth: {
    emailLogin: '/auth/email/login',
    requestPhoneOtp: '/auth/phone/request-otp',
    verifyPhoneOtp: '/auth/phone/verify-otp',
    googleLogin: '/auth/google',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me'
  }
} as const;
