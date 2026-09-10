import { Router } from "express";
import { db } from "../db";
import { serializeAlbum, serializeTrack } from "../serializers";
import { AlbumRow, TrackRow } from "../types";

export const albumsRouter = Router();

// GET /api/albums - list published albums, newest first
albumsRouter.get("/", async (req, res, next) => {
  try {
    const search = (req.query.search as string | undefined)?.trim();

    let albums: AlbumRow[];
    if (search) {
      const like = `%${search.toLowerCase()}%`;
      albums = await db.queryAll<AlbumRow>(
        `SELECT * FROM albums
         WHERE is_published = 1 AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ?)
         ORDER BY created_at DESC`,
        [like, like]
      );
    } else {
      albums = await db.queryAll<AlbumRow>(
        "SELECT * FROM albums WHERE is_published = 1 ORDER BY created_at DESC"
      );
    }

    const withCounts = await Promise.all(
      albums.map(async (a) => {
        const tracks = await db.queryAll<TrackRow>(
          "SELECT * FROM tracks WHERE album_id = ? ORDER BY position ASC",
          [a.id]
        );
        return serializeAlbum(a, tracks);
      })
    );

    res.json({ albums: withCounts });
  } catch (err) {
    next(err);
  }
});

// GET /api/albums/featured - the one album currently featured on the homepage
albumsRouter.get("/featured", async (_req, res, next) => {
  try {
    const album = await db.queryOne<AlbumRow>(
      "SELECT * FROM albums WHERE is_published = 1 AND is_featured = 1 LIMIT 1"
    );

    if (!album) {
      return res.json({ album: null });
    }

    const tracks = await db.queryAll<TrackRow>(
      "SELECT * FROM tracks WHERE album_id = ? ORDER BY position ASC",
      [album.id]
    );

    res.json({ album: serializeAlbum(album, tracks) });
  } catch (err) {
    next(err);
  }
});

// GET /api/albums/:id - a single published album with its tracklist
albumsRouter.get("/:id", async (req, res, next) => {
  try {
    const album = await db.queryOne<AlbumRow>(
      "SELECT * FROM albums WHERE id = ? AND is_published = 1",
      [req.params.id]
    );

    if (!album) {
      return res.status(404).json({ error: "Album not found." });
    }

    const tracks = await db.queryAll<TrackRow>(
      "SELECT * FROM tracks WHERE album_id = ? ORDER BY position ASC",
      [album.id]
    );

    res.json({ album: serializeAlbum(album, tracks) });
  } catch (err) {
    next(err);
  }
});

// GET /api/tracks/:id - a single track
export const tracksRouter = Router();

tracksRouter.get("/:id", async (req, res, next) => {
  try {
    const track = await db.queryOne<TrackRow>(
      "SELECT * FROM tracks WHERE id = ?",
      [req.params.id]
    );

    if (!track) {
      return res.status(404).json({ error: "Track not found." });
    }

    const album = await db.queryOne<AlbumRow>(
      "SELECT * FROM albums WHERE id = ? AND is_published = 1",
      [track.album_id]
    );

    if (!album) {
      return res.status(404).json({ error: "Track not found." });
    }

    res.json({ track: serializeTrack(track) });
  } catch (err) {
    next(err);
  }
});
