import React, {createContext, useContext, useState, ReactNode} from 'react';
import {useColorScheme} from 'react-native';
import {lightColors, darkColors, Colors} from './colors';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  colors: Colors;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({children}: {children: ReactNode}) => {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  const isDark = 
    mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{colors, mode, isDark, setMode}}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
