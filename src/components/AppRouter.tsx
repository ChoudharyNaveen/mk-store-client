import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { LayoutWrapper } from './LayoutWrapper';
import { publicRoutes, protectedRoutes } from '../routes/routes';
import { useVersionCheck } from '../hooks/useVersionCheck';
import { initializeAuthFromStorage } from '../store/authInit';

/**
 * AppRouter component
 * Handles routing, layout, and app-level initialization
 */
export function AppRouter() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Initialize auth state from localStorage on app mount
  useEffect(() => {
    initializeAuthFromStorage();
  }, []);

  // Initialize version checking
  useVersionCheck();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        {publicRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            element={<LayoutWrapper isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />}
          >
            {protectedRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

