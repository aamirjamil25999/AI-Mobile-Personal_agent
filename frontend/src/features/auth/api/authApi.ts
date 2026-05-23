import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
import type {
  AuthResponse,
  EmailLoginInput,
  EmailSignupInput,
  GoogleLoginInput,
  PhoneRequestOtpInput,
  PhoneVerifyOtpInput,
  UserProfile
} from '@/features/auth/types/auth';
import type { RootState } from '@/store';

type RefreshResponse = {
  accessToken: string;
};

type OtpResponse = {
  message: string;
};

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: 'include',
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
    signupWithEmail: builder.mutation<AuthResponse, EmailSignupInput>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.emailSignup,
        method: 'POST',
        body
      })
    }),
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
    refreshToken: builder.mutation<RefreshResponse, void>({
      query: () => ({
        url: API_ENDPOINTS.auth.refresh,
        method: 'POST'
      })
    }),
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: API_ENDPOINTS.auth.logout,
        method: 'POST'
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
  useSignupWithEmailMutation,
  useLoginWithEmailMutation,
  useRequestPhoneOtpMutation,
  useVerifyPhoneOtpMutation,
  useLoginWithGoogleMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetMeQuery
} = authApi;
