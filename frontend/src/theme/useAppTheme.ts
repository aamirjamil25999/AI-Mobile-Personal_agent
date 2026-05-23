import { getTheme } from '@/theme';
import { useAppSelector } from '@/store/hooks';

export const useAppTheme = () => {
  const mode = useAppSelector((state) => state.theme.mode);
  return getTheme(mode);
};
