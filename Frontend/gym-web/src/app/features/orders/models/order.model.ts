import { OrderItem } from './order-item.model';

export interface Order {
  id: string;
  userId: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'PROCESSING';
  totalPrice: number;
  items: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CheckoutResponse {
  message: string;
  orderId: string;
  status: string;
  total: number;
}
