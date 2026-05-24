import { useAppSelector } from '@/store/hooks';
import { getTheme } from '@/theme';

export const useAppTheme = () => {
  const mode = useAppSelector((state) => state.theme.mode);
  return getTheme(mode);
};
