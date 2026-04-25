export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  productImage?: string;
  productDescription?: string;
  productStatus?: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
}
