import { fetchOrderDetails } from '../../services/order.service';
import type { Order, OrderStatus, PaymentStatus, OrderPriority } from '../../types/order';

export interface OrderDetailOrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image?: string;
  variant_name?: string;
  variant_type?: string;
  variant_value?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  final_price: number;
  combo_id?: boolean;
  subtotal?: number;
  combo_quantity?: number;
}

export interface OrderDetailData extends Order {
  concurrency_stamp: string;
  rawOrderStatus?: string;
  orderItems: OrderDetailOrderItem[];
  statusHistory?: Array<{
    id: number;
    status: string;
    timestamp: string;
    changedBy?: string;
    notes?: string;
    isCurrent?: boolean;
    previousStatus?: string | null;
  }>;
  riderInformation?: { rider_name: string; rider_phone_number: string; rider_pickup_time: string } | null;
  appliedDiscounts?: Array<{
    type: string;
    code?: string;
    description: string;
    discount_amount: number;
    status: string;
  }>;
}

type OrderDetailsApiData = Awaited<ReturnType<typeof fetchOrderDetails>>;

export function mapApiDataToOrderDetail(apiData: OrderDetailsApiData): OrderDetailData {
  return {
    id: apiData.order_id,
    order_number: apiData.order_number,
    total_amount: apiData.summary.subtotal,
    discount_amount: apiData.summary.discount,
    shipping_charges: apiData.summary.shipping,
    final_amount: apiData.summary.total,
    order_priority: apiData.order_information.priority as OrderPriority,
    estimated_delivery_time: apiData.order_information.estimated_delivery || null,
    refund_amount: 0,
    refund_status: 'NONE',
    status: apiData.order_information.order_status as OrderStatus,
    rawOrderStatus: apiData.order_information.order_status,
    payment_status: apiData.order_information.payment_status as PaymentStatus,
    rider_id: apiData.rider_information ? 1 : null,
    branch_id: 0,
    address_id: 0,
    created_by: 0,
    created_at: apiData.order_information.order_date,
    updated_at: apiData.order_information.order_date,
    concurrency_stamp: apiData.concurrency_stamp || '',
    address: {
      id: 0,
      house_no: apiData.delivery_address.address_line_1 || '',
      street_details: apiData.delivery_address.street_details || apiData.delivery_address.address_line_1 || '',
      landmark: apiData.delivery_address.landmark || apiData.delivery_address.address_line_2,
      name: apiData.delivery_address.recipient_name,
      mobile_number: apiData.delivery_address.mobile_number || '',
    },
    user: {
      id: 0,
      name: apiData.customer_information.name,
      email: apiData.customer_information.email,
      mobile_number: apiData.customer_information.mobile_number,
    },
    orderDiscount: [],
    orderItems: apiData.order_items.map((item) => ({
      id: item.id,
      product_id: item.product.id,
      product_name: item.product.title,
      product_image: item.product.image,
      variant_name: item.variant?.variant_name || item.variant?.name,
      variant_type: item.variant?.variant_type,
      variant_value: item.variant?.variant_value,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity,
      discount_amount: item.discount,
      final_price: item.total,
      combo_id: item.combo_id || false,
      subtotal: item.total,
      combo_quantity: item.combo_quantity || 0,
    })),
    statusHistory:
      apiData.status_history
        ?.reverse()
        ?.map((historyItem) => ({
          id: historyItem.id,
          status: historyItem.status,
          timestamp: historyItem.changed_at,
          changedBy: historyItem.changed_by?.name || historyItem.changed_by?.email || 'System',
          notes: historyItem.notes || undefined,
          previousStatus: historyItem.previous_status || undefined,
          isCurrent: historyItem.status === apiData.order_information.order_status,
        })) ?? [],
    riderInformation: apiData.rider_information ?? null,
    appliedDiscounts: apiData.applied_discounts,
  };
}
