import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
import { clearSession, setAccessToken } from '@/features/auth/slices/authSlice';
import type {
  AuthResponse,
  EmailLoginInput,
  EmailSignupInput,
  ForgotPasswordInput,
  ForgotPasswordResponse,
  GoogleLoginInput,
  PhoneRequestOtpInput,
  ResetPasswordInput,
  PhoneVerifyOtpInput,
  UserProfile
} from '@/features/auth/types/auth';
import type { RootState } from '@/store';

type RefreshResponse = {
  accessToken: string;
};

type OtpResponse = {
  message: string;
  otp?: string;
};

const rawBaseQuery = fetchBaseQuery({
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
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const requestUrl = typeof args === 'string' ? args : args.url;
  const isRefreshRequest = requestUrl === API_ENDPOINTS.auth.refresh;

  if (result.error?.status === 401 && !isRefreshRequest) {
    const refreshResult = await rawBaseQuery(
      {
        url: API_ENDPOINTS.auth.refresh,
        method: 'POST'
      },
      api,
      extraOptions
    );

    if (refreshResult.data && typeof refreshResult.data === 'object') {
      const accessToken = (refreshResult.data as RefreshResponse).accessToken;

      if (typeof accessToken === 'string' && accessToken.length > 0) {
        api.dispatch(setAccessToken({ accessToken }));
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(clearSession());
      }
    } else {
      api.dispatch(clearSession());
    }
  }

  return result;
};

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
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
    forgotPassword: builder.mutation<ForgotPasswordResponse, ForgotPasswordInput>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.forgotPassword,
        method: 'POST',
        body
      })
    }),
    resetPassword: builder.mutation<{ message: string }, ResetPasswordInput>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.resetPassword,
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
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetMeQuery
} = authApi;
