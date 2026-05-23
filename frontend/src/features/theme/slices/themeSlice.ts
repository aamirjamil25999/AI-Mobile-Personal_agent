import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ThemeMode } from '@/theme';

type ThemeState = {
  mode: ThemeMode;
};

const initialState: ThemeState = {
  mode: 'dark'
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
    },
    toggleThemeMode: (state) => {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
    }
  }
});

export const { setThemeMode, toggleThemeMode } = themeSlice.actions;

export default themeSlice.reducer;
