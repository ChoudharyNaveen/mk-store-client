/**
 * Branch Redux Slice
 * Manages branch state including branches list and selected branch
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Branch } from '../types/branch';

interface BranchState {
  branches: Branch[];
  selectedBranchId: number | null;
  isLoading: boolean;
}

/**
 * Get selected branch ID from localStorage
 */
const getSelectedBranchIdFromStorage = (): number | null => {
  try {
    const savedBranchId = localStorage.getItem('selected_branch_id');
    return savedBranchId ? parseInt(savedBranchId, 10) : null;
  } catch (error) {
    console.error('Error getting selected branch from storage:', error);
    return null;
  }
};

/**
 * Save selected branch ID to localStorage
 */
const saveSelectedBranchIdToStorage = (branchId: number | null): void => {
  try {
    if (branchId !== null) {
      localStorage.setItem('selected_branch_id', String(branchId));
    } else {
      localStorage.removeItem('selected_branch_id');
    }
  } catch (error) {
    console.error('Error saving selected branch to storage:', error);
  }
};

const initialState: BranchState = {
  branches: [],
  selectedBranchId: getSelectedBranchIdFromStorage(),
  isLoading: false,
};

const branchSlice = createSlice({
  name: 'branch',
  initialState,
  reducers: {
    setBranches: (state, action: PayloadAction<Branch[]>) => {
      state.branches = action.payload;
      
      // If we have a saved branch ID, try to use it
      const savedBranchId = getSelectedBranchIdFromStorage();
      if (savedBranchId !== null && action.payload.length > 0) {
        const branchExists = action.payload.some(branch => branch.id === savedBranchId);
        if (branchExists) {
          state.selectedBranchId = savedBranchId;
          return;
        }
      }
      
      // Set first branch as default if no branch is selected
      if (action.payload.length > 0 && state.selectedBranchId === null) {
        const firstBranchId = action.payload[0].id;
        state.selectedBranchId = firstBranchId;
        saveSelectedBranchIdToStorage(firstBranchId);
      }
    },
    setSelectedBranch: (state, action: PayloadAction<number>) => {
      // Validate that the branch exists in the list
      const branchExists = state.branches.some(branch => branch.id === action.payload);
      if (branchExists) {
        state.selectedBranchId = action.payload;
        saveSelectedBranchIdToStorage(action.payload);
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearBranches: (state) => {
      state.branches = [];
      state.selectedBranchId = null;
      saveSelectedBranchIdToStorage(null);
    },
  },
});

export const { setBranches, setSelectedBranch, setLoading, clearBranches } = branchSlice.actions;
export default branchSlice.reducer;

