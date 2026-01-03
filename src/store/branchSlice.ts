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

const initialState: BranchState = {
  branches: [],
  selectedBranchId: null,
  isLoading: false,
};

const branchSlice = createSlice({
  name: 'branch',
  initialState,
  reducers: {
    setBranches: (state, action: PayloadAction<Branch[]>) => {
      state.branches = action.payload;
      // Set first branch as default if no branch is selected
      if (action.payload.length > 0 && state.selectedBranchId === null) {
        state.selectedBranchId = action.payload[0].id;
      }
    },
    setSelectedBranch: (state, action: PayloadAction<number>) => {
      // Validate that the branch exists in the list
      const branchExists = state.branches.some(branch => branch.id === action.payload);
      if (branchExists) {
        state.selectedBranchId = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearBranches: (state) => {
      state.branches = [];
      state.selectedBranchId = null;
    },
  },
});

export const { setBranches, setSelectedBranch, setLoading, clearBranches } = branchSlice.actions;
export default branchSlice.reducer;

