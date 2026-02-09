import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setDateRange as setDateRangeAction } from '../store/dateRangeSlice';
import { getLastNDaysRangeForDatePicker } from '../utils/date';
import type { DateRangeSelection } from '../components/DateRangePopover';

const DEFAULT_DAYS = 30;

/**
 * Shared hook for list pages: date range state synced with Redux store.
 * Returns local dateRange, setter, and apply handler that updates both local state and store.
 */
export function useListPageDateRange(defaultDays: number = DEFAULT_DAYS) {
    const dispatch = useAppDispatch();
    const storeStartDate = useAppSelector((state) => state.dateRange.startDate);
    const storeEndDate = useAppSelector((state) => state.dateRange.endDate);

    const [dateRange, setDateRange] = useState<DateRangeSelection>(() => {
        if (storeStartDate && storeEndDate) {
            return [{
                startDate: new Date(storeStartDate),
                endDate: new Date(storeEndDate),
                key: 'selection',
            }];
        }
        return getLastNDaysRangeForDatePicker(defaultDays);
    });

    useEffect(() => {
        if (storeStartDate && storeEndDate) {
            setDateRange([{
                startDate: new Date(storeStartDate),
                endDate: new Date(storeEndDate),
                key: 'selection',
            }]);
        }
    }, [storeStartDate, storeEndDate]);

    const handleDateRangeApply = (newRange: DateRangeSelection) => {
        setDateRange(newRange);
        const range = newRange?.[0];
        if (range) {
            dispatch(setDateRangeAction({ startDate: range.startDate, endDate: range.endDate }));
        }
    };

    return { dateRange, setDateRange, handleDateRangeApply };
}
