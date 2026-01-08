import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from '../store/store';
import { ToastProvider } from '../contexts/ToastContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { useAppSelector } from '../store/hooks';
import theme from '../theme';

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
 * AppProviders component
 * Wraps the application with all necessary providers (Redux, Theme, Toast, Notifications)
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppProvidersInner>{children}</AppProvidersInner>
      </ThemeProvider>
    </Provider>
  );
}

