export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationInDays: number | null;
  status: 'ACTIVE' | 'INACTIVE' | string;
  features?: string[];
  capabilities?: string[];
}
