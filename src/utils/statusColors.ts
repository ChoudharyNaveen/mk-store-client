/**
 * Consistent status chip colors across the app
 */

/** Order status → MUI Chip color */
export function getOrderStatusColor(status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'DELIVERED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'CANCELLED':
    case 'REJECTED':
    case 'FAILED':
      return 'error';
    case 'ACCEPTED':
    case 'CONFIRMED':
    case 'PROCESSING':
    case 'SHIPPED':
    case 'READY_FOR_PICKUP':
    case 'PICKED_UP':
    case 'ARRIVED':
      return 'primary';
    case 'RETURN':
    case 'RETURNED':
      return 'warning';
    default:
      return 'default';
  }
}

/** Luminance threshold: below = white text, above = black text */
const LUM_THRESHOLD = 0.5;
function getContrastColor(hex: string): string {
  const m = hex.replace(/^#/, '').match(/.{2}/g);
  if (!m) return '#000';
  const [r, g, b] = m.map((x) => parseInt(x, 16) / 255);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum < LUM_THRESHOLD ? '#fff' : '#000';
}

/** Order status → custom sx (bgcolor, color) for Chip when MUI color isn't enough */
export function getOrderStatusSx(status: string): { bgcolor: string; color: string } {
  const styles: Record<string, { bgcolor: string }> = {
    DELIVERED: { bgcolor: '#a5d6a7' },
    PENDING: { bgcolor: '#ffcc80' },
    CANCELLED: { bgcolor: '#ef9a9a' },
    REJECTED: { bgcolor: '#bcaaa4' },
    FAILED: { bgcolor: '#e57373' },
    RETURN: { bgcolor: '#ffb74d' },
    RETURNED: { bgcolor: '#ffa726' },
    ACCEPTED: { bgcolor: '#90caf9' },
    CONFIRMED: { bgcolor: '#4fc3f7' },
    PROCESSING: { bgcolor: '#9fa8da' },
    SHIPPED: { bgcolor: '#80cbc4' },
    READY_FOR_PICKUP: { bgcolor: '#ce93d8' },
    PICKED_UP: { bgcolor: '#b39ddb' },
    ARRIVED: { bgcolor: '#b0bec5' },
  };
  const base = styles[(status || '').toUpperCase()] ?? { bgcolor: '#bdbdbd' };
  return { bgcolor: base.bgcolor, color: getContrastColor(base.bgcolor) };
}

/** Payment status → MUI Chip color */
export function getPaymentStatusColor(status: string): 'default' | 'success' | 'warning' | 'error' {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'PAID':
      return 'success';
    case 'UNPAID':
      return 'error';
    case 'PARTIAL':
      return 'warning';
    case 'REFUNDED':
      return 'default';
    default:
      return 'default';
  }
}

/** Entity status (ACTIVE/INACTIVE) → MUI Chip color */
export function getEntityStatusColor(status: string): 'default' | 'success' {
  return (status || '').toUpperCase() === 'ACTIVE' ? 'success' : 'default';
}
