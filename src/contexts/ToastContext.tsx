/**
 * Toast Context
 * Provides toast notification functionality using MUI Snackbar
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
} from 'react';
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

const DEFAULT_DURATIONS: Record<ToastSeverity, number> = {
  success: 5000,
  error: 6000,
  warning: 5500,
  info: 5000,
};

interface ToastContextType {
  showToast: (message: string, options?: ToastOptions) => void;
  showSuccessToast: (message: string, title?: string) => void;
  showErrorToast: (message: string, title?: string) => void;
  showWarningToast: (message: string, title?: string) => void;
  showInfoToast: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Global toast service
let globalToastService: ToastContextType | null = null;
export const getToastService = () => globalToastService;

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};

interface ToastState {
  open: boolean;
  message: string;
  severity: ToastSeverity;
  title?: string;
  duration: number;
  action?: ReactNode;
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
    duration: 5000,
  });

  const [progress, setProgress] = useState(100);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const remainingTimeRef = useRef<number>(0);
  const isHoveredRef = useRef<boolean>(false);

  /* =========================
     Toast triggers
  ========================== */

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const severity = options?.severity ?? 'info';
    const duration = options?.duration ?? DEFAULT_DURATIONS[severity];

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    endTimeRef.current = Date.now() + duration;
    remainingTimeRef.current = duration;

    setToast({
      open: true,
      message,
      severity,
      title: options?.title,
      duration,
      action: options?.action,
    });

    setProgress(100);
    isHoveredRef.current = false;
  }, []);

  const showSuccessToast = useCallback(
    (message: string, title?: string) =>
      showToast(message, { severity: 'success', title }),
    [showToast]
  );

  const showErrorToast = useCallback(
    (message: string, title?: string) =>
      showToast(message, { severity: 'error', title }),
    [showToast]
  );

  const showWarningToast = useCallback(
    (message: string, title?: string) =>
      showToast(message, { severity: 'warning', title }),
    [showToast]
  );

  const showInfoToast = useCallback(
    (message: string, title?: string) =>
      showToast(message, { severity: 'info', title }),
    [showToast]
  );

  /* =========================
     Close handler
  ========================== */

  const handleClose = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setToast((p) => ({ ...p, open: false }));
    isHoveredRef.current = false;
  }, []);

  /* =========================
     Progress timer
  ========================== */

  useEffect(() => {
    if (!toast.open) return;

    const tick = () => {
      if (isHoveredRef.current || !endTimeRef.current) return;

      const now = Date.now();
      const remaining = Math.max(0, endTimeRef.current - now);
      const percent = (remaining / toast.duration) * 100;

      setProgress(percent);

      if (remaining <= 0) {
        handleClose();
      }
    };

    timerRef.current = setInterval(tick, 50);
    tick();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [toast.open, toast.duration, handleClose]);

  /* =========================
     Hover pause / resume
  ========================== */

  const handleMouseEnter = () => {
    if (!endTimeRef.current) return;

    remainingTimeRef.current = Math.max(0, endTimeRef.current - Date.now());
    endTimeRef.current = null;

    isHoveredRef.current = true;
  };

  const handleMouseLeave = () => {
    endTimeRef.current = Date.now() + remainingTimeRef.current;

    isHoveredRef.current = false;
  };

  /* =========================
     Context value
  ========================== */

  const value = useMemo(
    () => ({
      showToast,
      showSuccessToast,
      showErrorToast,
      showWarningToast,
      showInfoToast,
    }),
    [showToast, showSuccessToast, showErrorToast, showWarningToast, showInfoToast]
  );

  useEffect(() => {
    globalToastService = value;
    return () => {
      globalToastService = null;
    };
  }, [value]);

  const PROGRESS_COLORS: Record<ToastSeverity, { track: string; bar: string }> = {
    success: {
      track: 'rgba(76, 175, 80, 0.25)',
      bar: 'rgba(76, 175, 80, 0.9)',
    },
    error: {
      track: 'rgba(244, 67, 54, 0.25)',
      bar: 'rgba(244, 67, 54, 0.9)',
    },
    warning: {
      track: 'rgba(255, 152, 0, 0.25)',
      bar: 'rgba(255, 152, 0, 0.9)',
    },
    info: {
      track: 'rgba(33, 150, 243, 0.25)',
      bar: 'rgba(33, 150, 243, 0.9)',
    },
  };


  /* =========================
     Render
  ========================== */

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={toast.open}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 8 }}
      >
        <Box
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          sx={{ minWidth: 320 }}
        >
          <Alert
            severity={toast.severity}
            variant="filled"
            onClose={handleClose}
            sx={{ position: 'relative', overflow: 'hidden' }}
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
                backgroundColor: PROGRESS_COLORS[toast.severity].track,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: PROGRESS_COLORS[toast.severity].bar,
                },
              }}
            />
          </Alert>
        </Box>
      </Snackbar>
    </ToastContext.Provider>
  );
};
