import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearSession } from '@/features/auth/slices/authSlice';
import { authApi } from '@/features/auth/api/authApi';
import { secureStorage } from '@/services/secureStorage';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  const logout = async () => {
    const refreshToken = auth.refreshToken ?? (await secureStorage.getRefreshToken());

    if (refreshToken) {
      try {
        await dispatch(authApi.endpoints.logout.initiate({ refreshToken })).unwrap();
      } catch {
        // Ignore remote logout failures to avoid trapping user in local session.
      }
    }

    await secureStorage.clearTokens();
    dispatch(clearSession());
  };

  return {
    ...auth,
    logout
  };
};
