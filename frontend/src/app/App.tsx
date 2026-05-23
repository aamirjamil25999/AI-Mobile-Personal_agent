import React, { useEffect } from 'react';
import { NavigationContainer, type Theme } from '@react-navigation/native';
import { Provider } from 'react-redux';

import { RootNavigator } from '@/navigation/RootNavigator';
import { authApi } from '@/features/auth/api/authApi';
import { clearSession, setTokens, setUser } from '@/features/auth/slices/authSlice';
import { secureStorage } from '@/services/secureStorage';
import { store } from '@/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getTheme } from '@/theme';

const AppShell = () => {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.theme.mode);

  useEffect(() => {
    const bootstrapSession = async () => {
      const refreshToken = await secureStorage.getRefreshToken();
      if (!refreshToken) {
        return;
      }

      try {
        const refresh = await dispatch(
          authApi.endpoints.refreshToken.initiate({ refreshToken })
        ).unwrap();

        dispatch(
          setTokens({
            accessToken: refresh.accessToken,
            refreshToken: refresh.refreshToken
          })
        );

        const me = await dispatch(authApi.endpoints.getMe.initiate()).unwrap();

        dispatch(setUser(me));
      } catch {
        await secureStorage.clearTokens();
        dispatch(clearSession());
      }
    };

    void bootstrapSession();
  }, [dispatch]);

  const appTheme = getTheme(mode);

  const navigationTheme: Theme = {
    dark: mode === 'dark',
    colors: {
      primary: appTheme.colors.primary,
      background: appTheme.colors.background,
      card: appTheme.colors.card,
      text: appTheme.colors.text,
      border: appTheme.colors.border,
      notification: appTheme.colors.danger
    }
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
};

const App = () => (
  <Provider store={store}>
    <AppShell />
  </Provider>
);

export default App;
