export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  product?: any;
  quantity: number;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}
