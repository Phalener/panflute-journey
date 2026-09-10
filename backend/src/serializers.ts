import { AlbumRow, TrackRow } from "./types";
import { getStorageUrl } from "./services/storage";

export function fixUtf8Encoding(str: string): string {
  if (!str) return "";
  if (!/[ÃÂ]/.test(str)) return str;
  try {
    const cp1252Map: Record<string, string> = {
      "\u20AC": "\x80", "\u201A": "\x82", "\u0192": "\x83", "\u201E": "\x84",
      "\u2026": "\x85", "\u2020": "\x86", "\u2021": "\x87", "\u02C6": "\x88",
      "\u2030": "\x89", "\u0160": "\x8A", "\u2039": "\x8B", "\u0152": "\x8C",
      "\u017D": "\x8E", "\u2018": "\x91", "\u2019": "\x92", "\u201C": "\x93",
      "\u201D": "\x94", "\u2022": "\x95", "\u2013": "\x96", "\u2014": "\x97",
      "\u02DC": "\x98", "\u2122": "\x99", "\u0161": "\x9A", "\u203A": "\x9B",
      "\u0153": "\x9C", "\u017E": "\x9E", "\u0178": "\x9F",
    };
    const raw = str.replace(
      /[\u20AC\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u017D\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u017E\u0178]/g,
      (c) => cp1252Map[c] || c
    );
    const decoded = Buffer.from(raw, "binary").toString("utf8");
    if (!decoded.includes("\uFFFD")) return decoded;
  } catch {
    // ignore
  }
  return str;
}

export function serializeTrack(t: TrackRow) {
  return {
    id: t.id,
    albumId: t.album_id,
    title: fixUtf8Encoding(t.title),
    url: getStorageUrl("songs", t.album_id, t.filename),
    durationSeconds: t.duration_seconds,
    lyrics: t.lyrics ? fixUtf8Encoding(t.lyrics) : null,
    position: t.position,
  };
}

export function serializeAlbum(a: AlbumRow, tracks?: TrackRow[]) {
  return {
    id: a.id,
    title: fixUtf8Encoding(a.title),
    description: fixUtf8Encoding(a.description),
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
