import { ReactNode, useMemo } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from '../store/store';
import { ToastProvider } from '../contexts/ToastContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { ThemeProvider, useThemeMode } from '../contexts/ThemeContext';
import { RecentlyViewedProvider } from '../contexts/RecentlyViewedContext';
import { useAppSelector } from '../store/hooks';
import { getTheme } from '../theme';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Inner component that has access to Redux store
 */
function AppProvidersInner({ children }: AppProvidersProps) {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <NotificationProvider user={user}>
      <ToastProvider>{children}</ToastProvider>
    </NotificationProvider>
  );
}

/**
 * MUI theme wrapper that reads mode from ThemeContext
 */
function ThemedContent({ children }: AppProvidersProps) {
  const { mode } = useThemeMode();
  const theme = useMemo(() => getTheme(mode), [mode]);
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

/**
 * AppProviders component
 * Wraps the application with all necessary providers (Redux, Theme, Toast, Notifications)
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <ThemedContent>
          <RecentlyViewedProvider>
            <AppProvidersInner>{children}</AppProvidersInner>
          </RecentlyViewedProvider>
        </ThemedContent>
      </ThemeProvider>
    </Provider>
  );
}

