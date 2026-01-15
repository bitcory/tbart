export interface ArtPiece {
  id: string;
  title: string;
  imageUrls: string[];
  prompt: string;
  negativePrompt?: string;
  author: string;
  date: string;
  model: string;
  ratio: string;
  tags: string[];
  likes: number;
  views: number;
}

export enum ViewMode {
  INTRO = 'INTRO',
  GALLERY = 'GALLERY',
  DETAIL = 'DETAIL'
}