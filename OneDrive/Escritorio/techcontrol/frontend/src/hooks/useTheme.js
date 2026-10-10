import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext.jsx';

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe utilizarse dentro de un <ThemeProvider>.');
  }
  return context;
}
