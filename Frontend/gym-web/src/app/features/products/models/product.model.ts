export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  image: string;
  stock: number;
  category: string;
  rating?: number;
  reviews?: number;
  createdAt?: string;
  updatedAt?: string;
}
