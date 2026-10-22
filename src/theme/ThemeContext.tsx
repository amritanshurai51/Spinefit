import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme, Theme } from './themes';

type Mode = 'light' | 'dark' | 'system';
const Ctx = createContext<{ theme: Theme; mode: Mode; setMode: (m: Mode) => void }>({
  theme: lightTheme, mode: 'light', setMode: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Keep the app in light mode by default; stored dark preferences are ignored for now.
  const [mode, setModeState] = useState<Mode>('light');
  const setMode = (m: Mode) => { setModeState(m); AsyncStorage.setItem('themeMode', m); };
  const isDark = mode === 'dark';
  return <Ctx.Provider value={{ theme: isDark ? darkTheme : lightTheme, mode, setMode }}>{children}</Ctx.Provider>;
};
export const useTheme = () => useContext(Ctx);
