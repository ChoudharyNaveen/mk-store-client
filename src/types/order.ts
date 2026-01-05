/**
 * Order related types
 */

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'PARTIAL' | 'REFUNDED';
export type OrderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type RefundStatus = 'NONE' | 'PENDING' | 'PROCESSED' | 'REJECTED';

export interface OrderAddress {
    id: number;
    house_no: string;
    street_details: string;
    landmark?: string;
    name: string;
    mobile_number: string;
}

export interface OrderUser {
    id: number;
    name: string;
    email: string;
    mobile_number: string;
}

export interface OrderDiscount {
    id?: number;
    discount_type?: string;
    discount_value?: number;
}

export interface Order {
    id: number;
    order_number: string;
    total_amount: number;
    discount_amount: number;
    shipping_charges: number;
    final_amount: number;
    order_priority: OrderPriority;
    estimated_delivery_time?: string | Date | null;
    refund_amount: number;
    refund_status: RefundStatus;
    status: OrderStatus;
    payment_status: PaymentStatus;
    rider_id?: number | null;
    branch_id: number;
    address_id: number;
    created_by: number;
    created_at: string;
    updated_at: string;
    concurrency_stamp: string;
    address?: OrderAddress;
    user?: OrderUser;
    orderDiscount?: OrderDiscount[];
}

export interface OrderListResponse {
    success: boolean;
    doc: Order[];
    pagination: {
        pageSize: number;
        pageNumber: number;
        totalCount: number;
        paginationEnabled: boolean;
    };
}


