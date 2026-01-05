/**
 * Redux Store Configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import branchReducer from './branchSlice';
import dateRangeReducer from './dateRangeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    branch: branchReducer,
    dateRange: dateRangeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

