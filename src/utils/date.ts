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

