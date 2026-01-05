/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 * Waits for auth initialization to complete before checking
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAppSelector } from '../store/hooks';

export default function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAppSelector((state) => state.auth);

  // Show loading while initializing auth
  if (isInitializing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Only redirect to login after initialization is complete
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

