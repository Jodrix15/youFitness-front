import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { defaultTheme, type Theme } from './theme';

const ThemeContext = createContext<Theme>(defaultTheme);

export function ThemeProvider({
  theme = defaultTheme,
  children,
}: {
  theme?: Theme;
  children: ReactNode;
}) {
  const value = useMemo(() => theme, [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/**
 * Crea estilos dependientes del tema sin recalcularlos en cada render.
 *
 *   const useStyles = makeStyles((t) => ({ box: { padding: t.spacing.lg } }));
 *   const styles = useStyles();
 */
export function makeStyles<T extends Record<string, unknown>>(factory: (theme: Theme) => T) {
  return function useStyles(): T {
    const theme = useTheme();
    return useMemo(() => factory(theme), [theme]);
  };
}
