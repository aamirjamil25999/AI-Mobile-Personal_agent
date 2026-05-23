import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
import type {
  AuthResponse,
  EmailLoginInput,
  GoogleLoginInput,
  PhoneRequestOtpInput,
  PhoneVerifyOtpInput,
  UserProfile
} from '@/features/auth/types/auth';
import type { RootState } from '@/store';

type RefreshInput = {
  refreshToken: string;
};

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

type OtpResponse = {
  message: string;
};

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    }
  }),
  endpoints: (builder) => ({
    loginWithEmail: builder.mutation<AuthResponse, EmailLoginInput>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.emailLogin,
        method: 'POST',
        body
      })
    }),
    requestPhoneOtp: builder.mutation<OtpResponse, PhoneRequestOtpInput>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.requestPhoneOtp,
        method: 'POST',
        body
      })
    }),
    verifyPhoneOtp: builder.mutation<AuthResponse, PhoneVerifyOtpInput>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.verifyPhoneOtp,
        method: 'POST',
        body
      })
    }),
    loginWithGoogle: builder.mutation<AuthResponse, GoogleLoginInput>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.googleLogin,
        method: 'POST',
        body
      })
    }),
    refreshToken: builder.mutation<RefreshResponse, RefreshInput>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.refresh,
        method: 'POST',
        body
      })
    }),
    logout: builder.mutation<{ message: string }, { refreshToken: string }>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.logout,
        method: 'POST',
        body
      })
    }),
    getMe: builder.query<UserProfile, void>({
      query: () => ({
        url: API_ENDPOINTS.auth.me,
        method: 'GET'
      })
    })
  })
});

export const {
  useLoginWithEmailMutation,
  useRequestPhoneOtpMutation,
  useVerifyPhoneOtpMutation,
  useLoginWithGoogleMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetMeQuery
} = authApi;
