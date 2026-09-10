import { AlbumRow, TrackRow } from "./types";
import { getStorageUrl } from "./services/storage";

export function serializeTrack(t: TrackRow) {
  return {
    id: t.id,
    albumId: t.album_id,
    title: t.title,
    url: getStorageUrl("songs", t.album_id, t.filename),
    durationSeconds: t.duration_seconds,
    position: t.position,
  };
}

export function serializeAlbum(a: AlbumRow, tracks?: TrackRow[]) {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    year: a.year,
    coverUrl: a.cover_filename
      ? getStorageUrl("covers", a.id, a.cover_filename)
      : null,
    isPublished: !!a.is_published,
    isFeatured: !!a.is_featured,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
    trackCount: tracks ? tracks.length : undefined,
    tracks: tracks ? tracks.map(serializeTrack) : undefined,
  };
}
