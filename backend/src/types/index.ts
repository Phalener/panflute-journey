export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface AlbumRow {
  id: number;
  title: string;
  description: string;
  year: number | null;
  cover_filename: string | null;
  is_published: number;
  is_featured: number;
  created_at: string;
  updated_at: string;
}

export interface TrackRow {
  id: number;
  album_id: number;
  title: string;
  filename: string;
  duration_seconds: number | null;
  lyrics?: string | null;
  position: number;
  created_at: string;
}

export interface AuthPayload {
  userId: number;
  email: string;
}
