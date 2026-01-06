import { useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { initVersionCheck, updateStoredVersion } from '../utils/versionCheck';
import { config } from '../config/env';
import { Button } from '@mui/material';

/**
 * Custom hook to handle version checking
 * Automatically checks for app updates and shows notification when available
 */
export function useVersionCheck(): void {
  const toast = useToast();

  useEffect(() => {
    // Update stored version on mount (in case user refreshed)
    updateStoredVersion();

    // Set up version checking with interval from config
    const cleanup = initVersionCheck(config.versionCheckInterval, () => {
      // New version available - show notification
      toast.showToast(
        'A new version of the application is available. Please refresh to get the latest updates.',
        {
          severity: 'warning',
          title: 'Update Available',
          duration: 0, // Don't auto-close
          action: (
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                updateStoredVersion();
                window.location.reload();
              }}
            >
              Refresh Now
            </Button>
          ),
        }
      );
    });

    return cleanup;
  }, [toast]);
}

