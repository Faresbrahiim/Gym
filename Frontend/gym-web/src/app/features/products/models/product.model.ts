export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  imagePath?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}
