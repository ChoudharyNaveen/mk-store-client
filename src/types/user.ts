/**
 * User related types
 */

export type UserRole = 'USER' | 'RIDER';

export interface User {
  id: string | number;
  name: string;
  phone: string;
  mobileNumber?: string;
  email: string;
  address: string;
  createdAt: string;
  status?: string;
  profileStatus?: string;
  role?: UserRole;
  concurrencyStamp?: string;
}

export interface UserListResponse {
  success: boolean;
  doc: User[];
  pagination: {
    pageSize: number;
    pageNumber: number;
    totalCount: number;
    paginationEnabled: boolean;
  };
}

export interface CreateUserRequest {
  name: string;
  phone: string;
  email: string;
  address: string;
  role?: UserRole;
}

export interface CreateUserResponse {
  success: boolean;
  message?: string;
  doc?: User;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  updatedBy: string | number;
  concurrencyStamp: string;
}

export interface UpdateUserResponse {
  success: boolean;
  message?: string;
  doc?: User;
}
