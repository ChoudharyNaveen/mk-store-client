import { Box, Typography } from '@mui/material';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { format } from 'date-fns';

export interface DeliveryWindowHighlightProps {
  deliveryTimeFrom?: string | null;
  deliveryTimeTo?: string | null;
  /** Slightly tighter layout for split-view panel */
  compact?: boolean;
}

function formatDeliveryInstant(iso: string): string {
  try {
    return format(new Date(iso), 'MMM d, yyyy · h:mm a');
  } catch {
    return iso;
  }
}

/**
 * Prominent delivery slot (API: delivery_time_from / delivery_time_to).
 */
export default function DeliveryWindowHighlight({
  deliveryTimeFrom,
  deliveryTimeTo,
  compact = false,
}: DeliveryWindowHighlightProps) {
  if (!deliveryTimeFrom && !deliveryTimeTo) return null;

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
        px: compact ? 1.75 : 2.25,
        py: compact ? 1.5 : 2,
        mb: compact ? 2 : 2.5,
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.main}14 0%, ${theme.palette.background.paper} 55%, ${theme.palette.primary.light}24 100%)`,
        border: '1px solid',
        borderColor: 'primary.light',
        boxShadow: '0 4px 18px rgba(25, 118, 210, 0.12)',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          borderRadius: '4px 0 0 4px',
          bgcolor: 'primary.main',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, pl: 0.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: compact ? 36 : 44,
            height: compact ? 36 : 44,
            borderRadius: 2,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            flexShrink: 0,
            boxShadow: 2,
          }}
        >
          <ScheduleIcon sx={{ fontSize: compact ? 20 : 24 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="overline"
            sx={{
              letterSpacing: 0.8,
              fontWeight: 700,
              color: 'primary.dark',
              display: 'block',
              lineHeight: 1.2,
            }}
          >
            Delivery window
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, mb: 1.25, fontWeight: 500 }}>
            Customer delivery slot from the order
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 1.25,
            }}
          >
            {deliveryTimeFrom && (
              <Box
                sx={{
                  px: 1.75,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  boxShadow: 1,
                  minWidth: compact ? 0 : 200,
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  From
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.dark', lineHeight: 1.35 }}>
                  {formatDeliveryInstant(deliveryTimeFrom)}
                </Typography>
              </Box>
            )}
            {deliveryTimeFrom && deliveryTimeTo && (
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 800, px: 0.5 }}>
                →
              </Typography>
            )}
            {deliveryTimeTo && (
              <Box
                sx={{
                  px: 1.75,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  border: '2px solid',
                  borderColor: 'success.main',
                  boxShadow: 1,
                  minWidth: compact ? 0 : 200,
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  To
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'success.dark', lineHeight: 1.35 }}>
                  {formatDeliveryInstant(deliveryTimeTo)}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
