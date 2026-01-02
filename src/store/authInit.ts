/**
 * Initialize Auth State from LocalStorage
 * This should be called on app startup to restore auth state
 */

import { store } from './store';
import { setAuth } from './authSlice';
import type { User } from '../types/auth';

/**
 * Initialize auth state from localStorage
 * Call this in App.tsx or main entry point
 */
export const initializeAuthFromStorage = () => {
  try {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');

    if (token && userData) {
      const user = JSON.parse(userData) as User;
      store.dispatch(setAuth({
        user,
        token,
        branchId: 1, // TODO: Get branchId from user data or API
      }));
    }
  } catch (error) {
    console.error('Error initializing auth from storage:', error);
  }
};

