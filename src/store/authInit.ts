/**
 * Initialize Auth State from LocalStorage
 * This should be called on app startup to restore auth state
 */

import { store } from './store';
import { setAuth } from './authSlice';
import { setBranches, setSelectedBranch } from './branchSlice';
import branchService from '../services/branch.service';
import type { User } from '../types/auth';

/**
 * Initialize auth state from localStorage
 * Call this in App.tsx or main entry point
 */
export const initializeAuthFromStorage = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');

    if (token && userData) {
      const user = JSON.parse(userData) as User;
      store.dispatch(setAuth({
        user,
        token,
      }));

      // Fetch branches if user is authenticated
      try {
        const branchResponse = await branchService.getBranches({ pageSize: 100 });
        if (branchResponse.success && branchResponse.doc && branchResponse.doc.length > 0) {
          // Store branches in Redux
          store.dispatch(setBranches(branchResponse.doc));
          
          // Set first branch as default
          const firstBranchId = branchResponse.doc[0].id;
          store.dispatch(setSelectedBranch(firstBranchId));
          
          // Update auth with selected branch ID
          store.dispatch(setAuth({
            user,
            token,
            branchId: firstBranchId,
          }));
        }
      } catch (branchError) {
        // Log error but don't block auth initialization
        console.error('Error fetching branches on init:', branchError);
      }
    }
  } catch (error) {
    console.error('Error initializing auth from storage:', error);
  }
};

