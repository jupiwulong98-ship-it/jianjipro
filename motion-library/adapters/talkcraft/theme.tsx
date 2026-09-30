import React, {createContext, useContext} from 'react';

export const defaultTheme = {
  accent: '#22d3ee',
  ink: '#ffffff',
  panelInk: '#171923',
  panel: '#f8fafc',
  fontFamily: '"PingFang SC", "Hiragino Sans GB", sans-serif',
};
export const ThemeContext = createContext(defaultTheme);
export const useTheme = () => useContext(ThemeContext);

// Change the visual skin without changing the original animation curves.
export function useSkin(css: string) {
  const theme = useContext(ThemeContext);
  return css.replaceAll('#0066cc', theme.accent)
    .replaceAll('#b8d7ff', theme.accent)
    .replaceAll('#1d1d1f', theme.panelInk)
    .replaceAll('#ffffff', theme.ink);
}

export function Skin({theme, children}: {theme: Partial<typeof defaultTheme>; children: React.ReactNode}) {
  return <ThemeContext.Provider value={{...defaultTheme, ...theme}}>{children}</ThemeContext.Provider>;
}
