import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearSession } from '@/features/auth/slices/authSlice';
import { authApi } from '@/features/auth/api/authApi';

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
