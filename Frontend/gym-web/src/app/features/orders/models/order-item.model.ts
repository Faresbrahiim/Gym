export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}
