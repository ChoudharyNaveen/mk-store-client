/**
 * Standalone DateRangePopover component
 * Wraps react-date-range DateRangePicker in a Popover with Apply/Cancel.
 * Only calls onChange when user clicks Apply with a valid start and end date.
 */

import React from 'react';
import { Popover, Button, Box } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { DateRangePicker, RangeKeyDict } from 'react-date-range';
import { format } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

export type DateRangeSelection = Array<{
  startDate: Date;
  endDate: Date;
  key: string;
}>;

export interface DateRangePopoverProps {
  /** Current applied date range (react-date-range format) */
  value: DateRangeSelection;
  /** Called when user clicks Apply with valid start and end date */
  onChange: (range: DateRangeSelection) => void;
  /** Optional format for the trigger button label. Default: "MMM dd, yyyy - MMM dd, yyyy" */
  formatLabel?: (startDate: Date, endDate: Date) => string;
  /** Number of months to show in the calendar. Default: 1 */
  months?: number;
  /** Whether to move range on first selection. Default: false */
  moveRangeOnFirstSelection?: boolean;
  /** Anchor origin for the popover */
  anchorOrigin?: { vertical: 'top' | 'bottom'; horizontal: 'left' | 'center' | 'right' };
  /** Transform origin for the popover */
  transformOrigin?: { vertical: 'top' | 'bottom'; horizontal: 'left' | 'center' | 'right' };
  /** Trigger button variant/size/sx - passed to MUI Button */
  buttonVariant?: 'text' | 'outlined' | 'contained';
  buttonSize?: 'small' | 'medium' | 'large';
  buttonSx?: object;
}

const defaultFormatLabel = (start: Date, end: Date) =>
  `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`;

export default function DateRangePopover({
  value,
  onChange,
  formatLabel = defaultFormatLabel,
  months = 1,
  moveRangeOnFirstSelection = false,
  anchorOrigin = { vertical: 'bottom', horizontal: 'center' },
  transformOrigin = { vertical: 'top', horizontal: 'center' },
  buttonVariant = 'outlined',
  buttonSize = 'medium',
  buttonSx,
}: DateRangePopoverProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [pendingRange, setPendingRange] = React.useState<DateRangeSelection>(value);
  const pendingRangeRef = React.useRef<DateRangeSelection>(value);

  React.useEffect(() => {
    if (anchorEl) {
      setPendingRange(value);
      pendingRangeRef.current = value;
    }
  }, [anchorEl, value]);

  const handleDateSelect = (ranges: RangeKeyDict) => {
    if (ranges.selection?.startDate && ranges.selection?.endDate) {
      const newRange: DateRangeSelection = [{
        startDate: ranges.selection.startDate,
        endDate: ranges.selection.endDate,
        key: ranges.selection.key || 'selection',
      }];
      setPendingRange(newRange);
      pendingRangeRef.current = newRange;
    }
  };

  const closePopover = () => setAnchorEl(null);

  const handleApply = () => {
    const applied = pendingRangeRef.current?.length ? pendingRangeRef.current : pendingRange;
    const range = applied?.[0];
    const isValid =
      range?.startDate &&
      range?.endDate &&
      !isNaN(new Date(range.startDate).getTime()) &&
      !isNaN(new Date(range.endDate).getTime());
    if (isValid) {
      onChange(applied);
    }
    closePopover();
  };

  const handleCancel = () => closePopover();

  const range = value?.[0];
  const buttonLabel = range?.startDate && range?.endDate
    ? formatLabel(range.startDate, range.endDate)
    : 'Select date range';

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        startIcon={<CalendarTodayIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          borderColor: 'divider',
          color: 'text.secondary',
          '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
          ...buttonSx,
        }}
      >
        {buttonLabel}
      </Button>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCancel}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
      >
        <Box sx={{ p: 1 }}>
          <DateRangePicker
            ranges={pendingRange}
            onChange={handleDateSelect}
            moveRangeOnFirstSelection={moveRangeOnFirstSelection}
            months={months}
            direction="horizontal"
          />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1,
              mt: 1,
              pt: 1,
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <Button size="small" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="small" variant="contained" onClick={handleApply}>
              Apply
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
}
