/**
 * Date Range Redux Slice
 * Manages date range state for filtering
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DateRangeState {
  startDate: Date | null;
  endDate: Date | null;
}

/**
 * Get date range from localStorage
 */
const getDateRangeFromStorage = (): { startDate: Date | null; endDate: Date | null } => {
  try {
    const savedStartDate = localStorage.getItem('date_range_start');
    const savedEndDate = localStorage.getItem('date_range_end');
    
    return {
      startDate: savedStartDate ? new Date(savedStartDate) : null,
      endDate: savedEndDate ? new Date(savedEndDate) : null,
    };
  } catch (error) {
    console.error('Error getting date range from storage:', error);
    return { startDate: null, endDate: null };
  }
};

/**
 * Save date range to localStorage
 */
const saveDateRangeToStorage = (startDate: Date | null, endDate: Date | null): void => {
  try {
    if (startDate) {
      localStorage.setItem('date_range_start', startDate.toISOString());
    } else {
      localStorage.removeItem('date_range_start');
    }
    
    if (endDate) {
      localStorage.setItem('date_range_end', endDate.toISOString());
    } else {
      localStorage.removeItem('date_range_end');
    }
  } catch (error) {
    console.error('Error saving date range to storage:', error);
  }
};

const storedDates = getDateRangeFromStorage();

const initialState: DateRangeState = {
  startDate: storedDates.startDate,
  endDate: storedDates.endDate,
};

const dateRangeSlice = createSlice({
  name: 'dateRange',
  initialState,
  reducers: {
    setDateRange: (state, action: PayloadAction<{ startDate: Date | null; endDate: Date | null }>) => {
      state.startDate = action.payload.startDate;
      state.endDate = action.payload.endDate;
      saveDateRangeToStorage(action.payload.startDate, action.payload.endDate);
    },
    clearDateRange: (state) => {
      state.startDate = null;
      state.endDate = null;
      saveDateRangeToStorage(null, null);
    },
  },
});

export const { setDateRange, clearDateRange } = dateRangeSlice.actions;
export default dateRangeSlice.reducer;

