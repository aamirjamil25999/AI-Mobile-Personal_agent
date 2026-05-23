import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { authApi } from '@/features/auth/api/authApi';
import authReducer from '@/features/auth/slices/authSlice';
import themeReducer from '@/features/theme/slices/themeSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  theme: themeReducer,
  [authApi.reducerPath]: authApi.reducer
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
