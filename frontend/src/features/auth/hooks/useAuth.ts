import { authApi } from '@/features/auth/api/authApi';
import { clearSession } from '@/features/auth/slices/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  const logout = async () => {
    try {
      await dispatch(authApi.endpoints.logout.initiate()).unwrap();
    } catch {
      // Ignore remote logout failures to avoid trapping user in local session.
    }

    dispatch(clearSession());
  };

  return {
    ...auth,
    logout
  };
};
