export type { CartItem } from './cart-item.model';
import { CartItem } from './cart-item.model';

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  status: 'ACTIVE' | 'CHECKOUT' | 'COMPLETED';
  createdAt?: string;
  updatedAt?: string;
}
