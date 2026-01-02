/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import http from '../utils/http';
import { setAuthToken, setUserData, clearAuthData } from '../utils/http';
import { API_URLS } from '../constants/urls';
import type { LoginRequest, LoginResponse, User } from '../types/auth';

export interface AuthService {
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  getCurrentUser: () => User | null;
  isAuthenticated: () => boolean;
}

/**
 * Login user
 */
const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await http.post<LoginResponse>(
      API_URLS.AUTH.LOGIN,
      credentials,
      { skipAuth: true }
    );

    // Store token and user data
    if (response.doc?.token) {
      setAuthToken(response.doc.token);
    }
    if (response.doc?.user) {
      setUserData(response.doc.user);
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Logout user
 */
const logout = async (): Promise<void> => {
  try {
    // Call logout API if needed
    // await http.post(API_URLS.AUTH.LOGOUT);
  } catch (error) {
    console.error('Logout API error:', error);
    // Continue with logout even if API call fails
  } finally {
    // Always clear local storage
    clearAuthData();
  }
};

/**
 * Get current user from storage
 */
const getCurrentUser = (): User | null => {
  try {
    const userData = localStorage.getItem('user_data');
    return userData ? (JSON.parse(userData) as User) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 */
const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('auth_token');
  const user = getCurrentUser();
  return !!(token && user);
};

const authService: AuthService = {
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
};

export default authService;

