import { format } from 'date-fns';
import type { Product } from '../types/product';

/**
 * Format item details for display
 */
export const formatItemDetails = (
    itemQuantity?: number | null,
    itemUnit?: string | null,
    itemsPerUnit?: number | null
): string => {
    const parts: string[] = [];
    
    if (itemQuantity !== undefined && itemQuantity !== null && itemUnit) {
        parts.push(`${itemQuantity} ${itemUnit}`);
    } else if (itemQuantity !== undefined && itemQuantity !== null) {
        parts.push(`${itemQuantity}`);
    } else if (itemUnit) {
        parts.push(itemUnit);
    }
    
    if (itemsPerUnit !== undefined && itemsPerUnit !== null) {
        parts.push(`${itemsPerUnit} items/unit`);
    }
    
    return parts.length > 0 ? parts.join(' × ') : 'N/A';
};

/**
 * Format expiry date with color coding
 */
export const formatExpiryDate = (expiryDate: string | Date | undefined | null): string => {
    if (!expiryDate) {
        return 'N/A';
    }
    
    try {
        const date = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
        return format(date, 'MMM dd, yyyy');
    } catch {
        return 'Invalid Date';
    }
};

/**
 * Get expiry date color based on days until expiry
 */
export const getExpiryDateColor = (expiryDate: string | Date | undefined | null): string => {
    if (!expiryDate) {
        return '#666';
    }
    
    try {
        const date = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(date);
        expiry.setHours(0, 0, 0, 0);
        
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return '#d32f2f'; // Red - expired
        } else if (diffDays <= 7) {
            return '#ed6c02'; // Orange - expiring soon
        } else {
            return '#2e7d32'; // Green - valid
        }
    } catch {
        return '#666';
    }
};

