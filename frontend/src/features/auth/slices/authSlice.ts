import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { AuthResponse, UserProfile } from '@/features/auth/types/auth';

type AuthState = {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
    setCredentials: (state, action: PayloadAction<AuthResponse>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
    setUser: (state, action: PayloadAction<UserProfile>) => {
      state.user = action.payload;
    },
    clearSession: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    }
  }
});

export const { setTokens, setCredentials, setUser, clearSession } = authSlice.actions;

export default authSlice.reducer;
