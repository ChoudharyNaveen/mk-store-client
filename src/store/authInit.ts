/**
 * Initialize Auth State from LocalStorage
 * This should be called on app startup to restore auth state
 */

import { store } from './store';
import { setAuth, setInitializing } from './authSlice';
import { setBranches } from './branchSlice';
import branchService from '../services/branch.service';
import { createEqFilter } from '../utils/filterBuilder';
import type { User } from '../types/auth';

// Flag to prevent duplicate initialization
let isInitializing = false;
let hasInitialized = false;

/**
 * Initialize auth state from localStorage
 * Call this in App.tsx or main entry point
 */
export const initializeAuthFromStorage = async () => {
  // Prevent duplicate calls
  if (isInitializing || hasInitialized) {
    return;
  }

  isInitializing = true;

  try {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');

    if (token && userData) {
      const user = JSON.parse(userData) as User;
      store.dispatch(setAuth({
        user,
        token,
      }));

      // Check if branches are already loaded
      const branchState = store.getState().branch;
      if (branchState.branches.length === 0) {
        // Fetch branches if user is authenticated and branches not already loaded
        try {
          const branchResponse = await branchService.getBranches({
            pageSize: 100,
            filters: user.vendorId != null ? [createEqFilter('vendorId', user.vendorId)] : [],
          });
          if (branchResponse.success && branchResponse.doc && branchResponse.doc.length > 0) {
            // Store branches in Redux (this will restore saved branch or set first as default)
            store.dispatch(setBranches(branchResponse.doc));
            
            // Get the selected branch ID (either from storage or first branch)
            const updatedBranchState = store.getState().branch;
            const selectedBranchId = updatedBranchState.selectedBranchId;
            
            if (selectedBranchId) {
              // Update auth with selected branch ID
              store.dispatch(setAuth({
                user,
                token,
                branchId: selectedBranchId,
              }));
            }
          }
        } catch (branchError) {
          // Log error but don't block auth initialization
          console.error('Error fetching branches on init:', branchError);
        }
      } else {
        // Branches already loaded, just update auth with selected branch ID
        const selectedBranchId = branchState.selectedBranchId;
        if (selectedBranchId) {
          store.dispatch(setAuth({
            user,
            token,
            branchId: selectedBranchId,
          }));
        }
      }
    } else {
      // No auth data found, mark initialization as complete
      store.dispatch(setInitializing(false));
    }

    hasInitialized = true;
  } catch (error) {
    console.error('Error initializing auth from storage:', error);
  } finally {
    isInitializing = false;
    // Mark initialization as complete
    store.dispatch(setInitializing(false));
  }
};

