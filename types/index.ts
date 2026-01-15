import { Timestamp } from 'firebase/firestore';

// Art Types
export interface ArtPiece {
  id: string;
  title: string;
  imageUrls: string[];
  prompt: string;
  negativePrompt?: string;
  author: string;
  uploadedBy?: string;
  date: string;
  model: string;
  ratio: string;
  tags: string[];
  likes: number;
  views: number;
  isPublished?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// User Types
export type UserRole = 'user' | 'admin' | 'superadmin';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  isActive: boolean;
}

// Stats Types
export interface DailyStats {
  date: string;
  totalViews: number;
  totalLikes: number;
  newUsers: number;
  newArts: number;
}

export interface SummaryStats {
  totalArtPieces: number;
  totalUsers: number;
  totalViews: number;
  totalLikes: number;
  lastUpdated: Timestamp;
}

// View Mode
export enum ViewMode {
  INTRO = 'INTRO',
  GALLERY = 'GALLERY',
  DETAIL = 'DETAIL'
}

// Form Types
export interface ArtFormData {
  title: string;
  prompt: string;
  negativePrompt?: string;
  author: string;
  model: string;
  ratio: string;
  tags: string[];
  isPublished: boolean;
}
