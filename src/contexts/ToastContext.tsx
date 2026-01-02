/**
 * Toast Context
 * Provides toast notification functionality using MUI Snackbar
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useMemo, useRef } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';

export type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  severity?: ToastSeverity;
  title?: string;
  duration?: number;
  action?: ReactNode;
}

// Default durations for different toast types (in milliseconds)
const DEFAULT_DURATIONS: Record<ToastSeverity, number> = {
  success: 5000,  // 5 seconds
  error: 6000,    // 6 seconds (errors need more time to read)
  warning: 5500,   // 5.5 seconds
  info: 5000,      // 5 seconds
};

interface ToastContextType {
  showToast: (message: string, options?: ToastOptions) => void;
  showSuccessToast: (message: string, title?: string) => void;
  showErrorToast: (message: string, title?: string) => void;
  showWarningToast: (message: string, title?: string) => void;
  showInfoToast: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Global toast service instance
let globalToastService: ToastContextType | null = null;

export const getToastService = (): ToastContextType | null => {
  return globalToastService;
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastState {
  open: boolean;
  message: string;
  severity: ToastSeverity;
  title?: string;
  duration: number;
  action?: ReactNode;
}

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
    duration: 5000, // Default 5 seconds
  });
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const remainingTimeRef = useRef<number>(5000);
  const isInitializedRef = useRef<boolean>(false);

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const severity = options?.severity || 'info';
    const duration = options?.duration ?? DEFAULT_DURATIONS[severity];
    // Reset all timer refs when showing new toast
    startTimeRef.current = null;
    remainingTimeRef.current = duration;
    isInitializedRef.current = false;
    setToast({
      open: true,
      message,
      severity,
      title: options?.title,
      duration,
      action: options?.action,
    });
    setProgress(100);
    setIsHovered(false);
  }, []);

  const showSuccessToast = useCallback((message: string, title?: string) => {
    showToast(message, { severity: 'success', title, duration: DEFAULT_DURATIONS.success });
  }, [showToast]);

  const showErrorToast = useCallback((message: string, title?: string) => {
    showToast(message, { severity: 'error', title, duration: DEFAULT_DURATIONS.error });
  }, [showToast]);

  const showWarningToast = useCallback((message: string, title?: string) => {
    showToast(message, { severity: 'warning', title, duration: DEFAULT_DURATIONS.warning });
  }, [showToast]);

  const showInfoToast = useCallback((message: string, title?: string) => {
    showToast(message, { severity: 'info', title, duration: DEFAULT_DURATIONS.info });
  }, [showToast]);

  const handleClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setToast((prev) => ({ ...prev, open: false }));
    setIsHovered(false);
  }, []);

  // Handle progress bar and auto-close timer
  useEffect(() => {
    if (!toast.open) {
      // Cleanup when toast closes
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      isInitializedRef.current = false;
      return;
    }

    // Only initialize timer when toast first opens, not on hover changes
    if (!isInitializedRef.current) {
      startTimeRef.current = Date.now();
      remainingTimeRef.current = toast.duration;
      isInitializedRef.current = true;
    }

    const updateProgress = () => {
      if (isHovered) {
        // Pause timer when hovered - don't update progress
        return;
      }

      if (!startTimeRef.current) {
        // Should not happen, but handle it
        startTimeRef.current = Date.now();
        return;
      }

      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, remainingTimeRef.current - elapsed);
      const progressPercent = (remaining / toast.duration) * 100;

      setProgress(progressPercent);

      if (remaining <= 0) {
        // Close toast when time is up
        handleClose();
      }
    };

    // Update progress every 50ms for smooth animation
    timerRef.current = setInterval(updateProgress, 50);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [toast.open, toast.duration, isHovered, handleClose]);

  const handleMouseEnter = useCallback(() => {
    if (toast.open && startTimeRef.current) {
      // Calculate and save remaining time when pausing
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
      // Clear start time to indicate we're paused
      startTimeRef.current = null;
    }
    setIsHovered(true);
  }, [toast.open]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    // Reset start time when resuming - this will continue from remainingTimeRef.current
    if (toast.open) {
      startTimeRef.current = Date.now();
    }
  }, [toast.open]);

  const value: ToastContextType = useMemo(() => ({
    showToast,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
  }), [showToast, showSuccessToast, showErrorToast, showWarningToast, showInfoToast]);

  // Register global toast service
  useEffect(() => {
    globalToastService = value;
    return () => {
      globalToastService = null;
    };
  }, [value]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={toast.open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 8 }}
        // Disable auto-hide since we're handling it manually
        autoHideDuration={null}
      >
        <Box
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          sx={{ width: '100%', minWidth: 300 }}
        >
          <Alert
            onClose={handleClose}
            severity={toast.severity}
            variant="filled"
            sx={{ width: '100%', position: 'relative', overflow: 'hidden' }}
            action={toast.action}
          >
            {toast.title && <AlertTitle>{toast.title}</AlertTitle>}
            {toast.message}
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: (() => {
                    // Different progress bar colors based on severity
                    const colorMap: Record<ToastSeverity, string> = {
                      success: 'rgba(76, 175, 80, 0.9)',    // Green for success
                      error: 'rgba(244, 67, 54, 0.9)',      // Red for error
                      warning: 'rgba(255, 152, 0, 0.9)',      // Orange for warning
                      info: 'rgba(33, 150, 243, 0.9)',       // Blue for info
                    };
                    return colorMap[toast.severity] || 'rgba(255, 255, 255, 0.8)';
                  })(),
                },
              }}
            />
          </Alert>
        </Box>
      </Snackbar>
    </ToastContext.Provider>
  );
};

