import { OrderItem } from './order-item.model';

export interface Order {
  id: number;
  userId: number;
  orderNumber: string;
  items: OrderItem[];
  totalItems: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shippingAddress?: string;
  createdAt?: string;
  updatedAt?: string;
}
