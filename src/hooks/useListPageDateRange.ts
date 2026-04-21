import { useState } from 'react';
import type { DateRangeSelection } from '../components/DateRangePopover';

/**
 * Shared hook for list pages: local-only date range state.
 * Default is null (no date filter). When user selects, it stores the range locally.
 */
export function useListPageDateRange() {
    const [dateRange, setDateRange] = useState<DateRangeSelection | null>(null);

    const handleDateRangeApply = (newRange: DateRangeSelection) => {
        setDateRange(newRange);
    };

    return { dateRange, setDateRange, handleDateRangeApply };
}
