import { Timestamp } from 'firebase/firestore';

// Art Types
export interface ArtPiece {
  id: string;
  title: string;
  imageUrls: string[];        // Thumbnails for display (400px)
  originalUrls?: string[];    // Original images for download (1920px)
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
  // Activity tracking
  likedArts?: string[];  // art IDs
  downloadedArts?: DownloadRecord[];
  viewedArts?: ViewRecord[];
}

export interface DownloadRecord {
  artId: string;
  downloadedAt: Timestamp;
}

export interface ViewRecord {
  artId: string;
  viewedAt: Timestamp;
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
