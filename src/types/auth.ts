/**
 * Authentication related types
 */

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type ProfileStatus = 'COMPLETE' | 'INCOMPLETE' | 'PENDING';
export type RoleName = 'VENDOR_ADMIN' | 'ADMIN' | 'USER' | string;

export interface User {
  id: number;
  name: string;
  mobileNumber: string;
  email: string;
  status: UserStatus;
  profileStatus: ProfileStatus;
  roleName: RoleName;
  vendorId?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  doc: {
    message: string;
    user: User;
    token: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

