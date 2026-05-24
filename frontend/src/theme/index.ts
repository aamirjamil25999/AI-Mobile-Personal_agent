export type ThemeMode = 'light' | 'dark';

export type AppTheme = {
  mode: ThemeMode;
  colors: {
    background: string;
    card: string;
    surface: string;
    surfaceAlt: string;
    primary: string;
    primaryText: string;
    text: string;
    textMuted: string;
    border: string;
    danger: string;
    success: string;
    inputBackground: string;
    placeholder: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    pill: number;
  };
};

const baseSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24
};

const baseRadius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999
};

const darkTheme: AppTheme = {
  mode: 'dark',
  colors: {
    background: '#050B17',
    card: '#0C1730',
    surface: '#102040',
    surfaceAlt: '#15294F',
    primary: '#27D4C8',
    primaryText: '#041018',
    text: '#E9F0FF',
    textMuted: '#9FB4D4',
    border: '#2A3B62',
    danger: '#FF6B6B',
    success: '#22C55E',
    inputBackground: '#14284A',
    placeholder: '#7F95BA'
  },
  spacing: baseSpacing,
  radius: baseRadius
};

const lightTheme: AppTheme = {
  mode: 'light',
  colors: {
    background: '#F4F7FF',
    card: '#FFFFFF',
    surface: '#EEF3FF',
    surfaceAlt: '#E4ECFF',
    primary: '#1668F2',
    primaryText: '#FFFFFF',
    text: '#122140',
    textMuted: '#4D6290',
    border: '#C8D5F0',
    danger: '#D94848',
    success: '#0D9F48',
    inputBackground: '#FFFFFF',
    placeholder: '#6F81A8'
  },
  spacing: baseSpacing,
  radius: baseRadius
};

export const getTheme = (mode: ThemeMode): AppTheme => (mode === 'dark' ? darkTheme : lightTheme);
