export interface Track {
  id: number;
  albumId: number;
  title: string;
  url: string;
  durationSeconds: number | null;
  position: number;
}

export interface Album {
  id: number;
  title: string;
  description: string;
  year: number | null;
  coverUrl: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  trackCount?: number;
  tracks?: Track[];
}

export interface AdminUser {
  id: number;
  email: string;
}
