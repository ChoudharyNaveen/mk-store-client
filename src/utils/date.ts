/**
 * Date Utility Functions
 * Helper functions for date calculations and formatting
 */

/**
 * Get date range for the last N days from today
 * @param days - Number of days to go back (default: 30)
 * @returns Object with startDate and endDate
 */
export const getLastNDaysRange = (days: number = 30): { startDate: Date; endDate: Date } => {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Reset time to start of day for startDate
    startDate.setHours(0, 0, 0, 0);
    
    // endDate should be tomorrow (today + 1 day)
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 1);
    // Reset time to end of day for endDate
    endDate.setHours(23, 59, 59, 999);
    
    return { startDate, endDate };
};

/**
 * Get date range for the last N days in react-date-range format
 * @param days - Number of days to go back (default: 30)
 * @returns Array with date range object for react-date-range
 */
export const getLastNDaysRangeForDatePicker = (days: number = 30) => {
    const { startDate, endDate } = getLastNDaysRange(days);
    return [
        {
            startDate,
            endDate,
            key: 'selection'
        }
    ];
};

/**
 * Format date to YYYY-MM-DD string
 * @param date - Date object to format
 * @returns Formatted date string
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Get start and end of a specific date
 * @param date - Date object
 * @returns Object with startOfDay and endOfDay
 */
export const getDayBounds = (date: Date): { startOfDay: Date; endOfDay: Date } => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return { startOfDay, endOfDay };
};

/** Preset label and range for date picker */
export type DatePresetKey = 'today' | 'last7' | 'last30' | 'thisMonth';

export interface DatePreset {
    key: DatePresetKey;
    label: string;
    getRange: () => { startDate: Date; endDate: Date };
}

/**
 * Get today's range (start of today to end of today)
 */
export const getTodayRange = (): { startDate: Date; endDate: Date } => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
};

/**
 * Get current month's range (first day to last day of month)
 */
export const getThisMonthRange = (): { startDate: Date; endDate: Date } => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
};

/**
 * Date presets for Dashboard and list filters
 */
export const DATE_PRESETS: DatePreset[] = [
    { key: 'today', label: 'Today', getRange: getTodayRange },
    { key: 'last7', label: 'Last 7 days', getRange: () => getLastNDaysRange(7) },
    { key: 'last30', label: 'Last 30 days', getRange: () => getLastNDaysRange(30) },
    {
        key: 'thisMonth',
        label: 'This month',
        getRange: getThisMonthRange,
    },
];

/**
 * Get react-date-range selection from a preset key
 */
export const getDateRangeFromPreset = (presetKey: DatePresetKey) => {
    const preset = DATE_PRESETS.find((p) => p.key === presetKey);
    if (!preset) return getLastNDaysRangeForDatePicker(30);
    const { startDate, endDate } = preset.getRange();
    return [{ startDate, endDate, key: 'selection' as const }];
};

