import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme, Theme } from './themes';

type Mode = 'light' | 'dark' | 'system';
const Ctx = createContext<{ theme: Theme; mode: Mode; setMode: (m: Mode) => void }>({
  theme: lightTheme, mode: 'system', setMode: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const system = useColorScheme();
  const [mode, setModeState] = useState<Mode>('system');
  useEffect(() => { AsyncStorage.getItem('themeMode').then(v => v && setModeState(v as Mode)); }, []);
  const setMode = (m: Mode) => { setModeState(m); AsyncStorage.setItem('themeMode', m); };
  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';
  return <Ctx.Provider value={{ theme: isDark ? darkTheme : lightTheme, mode, setMode }}>{children}</Ctx.Provider>;
};
export const useTheme = () => useContext(Ctx);
