export type UserRole = 'customer' | 'artisan';

export type ProjectStatus = 'open' | 'in_progress' | 'completed';

export type BidStatus = 'pending' | 'accepted' | 'rejected';

export interface Project {
  id: string;
  title: string;
  description: string;
  dimensions: string;
  priceMin: number;
  priceMax: number;
  status: ProjectStatus;
  customerId: string;
  image: string;
  createdAt: string;
}

export interface Bid {
  id: string;
  projectId: string;
  artisanId: string;
  artisanName: string;
  amount: number;
  days: number;
  proposal: string;
  status: BidStatus;
  createdAt: string;
}
