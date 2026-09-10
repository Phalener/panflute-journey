import path from "path";
import { Router } from "express";
import { db } from "../db";
import { albumDir, upload } from "../middleware/upload";
import { serializeAlbum, serializeTrack, fixUtf8Encoding } from "../serializers";
import { AlbumRow, TrackRow } from "../types";
import {
  uploadToStorage,
  deleteFromStorage,
  deleteAlbumStorage,
} from "../services/storage";

export const adminRouter = Router();

// ---------- Albums ----------

// GET /api/admin/albums - every album, published or not
adminRouter.get("/albums", async (_req, res, next) => {
  try {
    const albums = await db.queryAll<AlbumRow>(
      "SELECT * FROM albums ORDER BY created_at DESC"
    );

    const result = await Promise.all(
      albums.map(async (a) => {
        const tracks = await db.queryAll<TrackRow>(
          "SELECT * FROM tracks WHERE album_id = ? ORDER BY position ASC",
          [a.id]
        );
        return serializeAlbum(a, tracks);
      })
    );

    res.json({ albums: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/albums/:id
adminRouter.get("/albums/:id", async (req, res, next) => {
  try {
    const album = await db.queryOne<AlbumRow>(
      "SELECT * FROM albums WHERE id = ?",
      [req.params.id]
    );

    if (!album) return res.status(404).json({ error: "Album not found." });

    const tracks = await db.queryAll<TrackRow>(
      "SELECT * FROM tracks WHERE album_id = ? ORDER BY position ASC",
      [album.id]
    );

    res.json({ album: serializeAlbum(album, tracks) });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/albums - create a new album (metadata only)
adminRouter.post("/albums", async (req, res, next) => {
  try {
    const { title, description, year } = req.body as {
      title?: string;
      description?: string;
      year?: number | string;
    };

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Album title is required." });
    }

    const info = await db.execute(
      "INSERT INTO albums (title, description, year) VALUES (?, ?, ?)",
      [title.trim(), description?.trim() ?? "", year ? Number(year) : null]
    );

    albumDir(info.lastInsertRowid);

    const album = await db.queryOne<AlbumRow>(
      "SELECT * FROM albums WHERE id = ?",
      [info.lastInsertRowid]
    );

    res.status(201).json({ album: serializeAlbum(album!, []) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/albums/:id - update metadata / publish / feature
adminRouter.put("/albums/:id", async (req, res, next) => {
  try {
    const existing = await db.queryOne<AlbumRow>(
      "SELECT * FROM albums WHERE id = ?",
      [req.params.id]
    );

    if (!existing) return res.status(404).json({ error: "Album not found." });

    const { title, description, year, isPublished, isFeatured } = req.body as {
      title?: string;
      description?: string;
      year?: number | string | null;
      isPublished?: boolean;
      isFeatured?: boolean;
    };

    const nextTitle = title !== undefined ? title.trim() : existing.title;
    const nextDescription =
      description !== undefined ? description.trim() : existing.description;
    const nextYear =
      year !== undefined
        ? year === null || year === ""
          ? null
          : Number(year)
        : existing.year;
    const nextPublished =
      isPublished !== undefined ? (isPublished ? 1 : 0) : existing.is_published;

    if (!nextTitle) {
      return res.status(400).json({ error: "Album title cannot be empty." });
    }

    // Only one album can be featured at a time.
    if (isFeatured) {
      await db.execute("UPDATE albums SET is_featured = 0");
    }
    const nextFeatured =
      isFeatured !== undefined ? (isFeatured ? 1 : 0) : existing.is_featured;

    await db.execute(
      `UPDATE albums
       SET title = ?, description = ?, year = ?, is_published = ?, is_featured = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [nextTitle, nextDescription, nextYear, nextPublished, nextFeatured, existing.id]
    );

    const album = await db.queryOne<AlbumRow>(
      "SELECT * FROM albums WHERE id = ?",
      [existing.id]
    );
    const tracks = await db.queryAll<TrackRow>(
      "SELECT * FROM tracks WHERE album_id = ? ORDER BY position ASC",
      [existing.id]
    );

    res.json({ album: serializeAlbum(album!, tracks) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/albums/:id - delete an album, its tracks, and its files
adminRouter.delete("/albums/:id", async (req, res, next) => {
  try {
    const existing = await db.queryOne<AlbumRow>(
      "SELECT * FROM albums WHERE id = ?",
      [req.params.id]
    );

    if (!existing) return res.status(404).json({ error: "Album not found." });

    await db.execute("DELETE FROM albums WHERE id = ?", [existing.id]);
    await deleteAlbumStorage(existing.id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/albums/:id/cover - upload or replace the cover image
adminRouter.post(
  "/albums/:id/cover",
  (req, res, next) => {
    req.params.albumId = req.params.id;
    next();
  },
  upload.single("cover"),
  async (req, res, next) => {
    try {
      const existing = await db.queryOne<AlbumRow>(
        "SELECT * FROM albums WHERE id = ?",
        [req.params.id]
      );

      if (!existing) return res.status(404).json({ error: "Album not found." });
      if (!req.file) return res.status(400).json({ error: "No cover image received." });

      // Remove the previous cover file if one exists.
      if (existing.cover_filename) {
        await deleteFromStorage("covers", existing.id, existing.cover_filename);
      }

      // Upload to R2 / storage
      await uploadToStorage(req.file, "covers", existing.id);

      await db.execute(
        "UPDATE albums SET cover_filename = ?, updated_at = datetime('now') WHERE id = ?",
        [req.file.filename, existing.id]
      );

      const album = await db.queryOne<AlbumRow>(
        "SELECT * FROM albums WHERE id = ?",
        [existing.id]
      );
      res.json({ album: serializeAlbum(album!) });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/admin/albums/:id/cover
adminRouter.delete("/albums/:id/cover", async (req, res, next) => {
  try {
    const existing = await db.queryOne<AlbumRow>(
      "SELECT * FROM albums WHERE id = ?",
      [req.params.id]
    );

    if (!existing) return res.status(404).json({ error: "Album not found." });

    if (existing.cover_filename) {
      await deleteFromStorage("covers", existing.id, existing.cover_filename);
    }

    await db.execute(
      "UPDATE albums SET cover_filename = NULL, updated_at = datetime('now') WHERE id = ?",
      [existing.id]
    );

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ---------- Tracks ----------

// POST /api/admin/albums/:id/tracks - upload one or several MP3 files at once
adminRouter.post(
  "/albums/:id/tracks",
  (req, res, next) => {
    req.params.albumId = req.params.id;
    next();
  },
  upload.array("tracks", 30),
  async (req, res, next) => {
    try {
      const album = await db.queryOne<AlbumRow>(
        "SELECT * FROM albums WHERE id = ?",
        [req.params.id]
      );

      if (!album) return res.status(404).json({ error: "Album not found." });

      const files = (req.files as Express.Multer.File[]) ?? [];
      if (files.length === 0) {
        return res.status(400).json({ error: "No MP3 files received." });
      }

      const maxPositionRow = await db.queryOne<{ maxPosition?: number | null; maxposition?: number | null }>(
        "SELECT MAX(position) as maxPosition FROM tracks WHERE album_id = ?",
        [album.id]
      );
      const currentMax = maxPositionRow?.maxPosition ?? maxPositionRow?.maxposition ?? -1;
      let nextPosition = currentMax + 1;

      const inserted: TrackRow[] = [];
      for (const file of files) {
        const cleanName = fixUtf8Encoding(file.originalname);
        const niceTitle = path
          .basename(cleanName, path.extname(cleanName))
          .replace(/[-_]+/g, " ")
          .trim();

        await uploadToStorage(file, "songs", album.id);

        const info = await db.execute(
          "INSERT INTO tracks (album_id, title, filename, position) VALUES (?, ?, ?, ?)",
          [album.id, niceTitle || cleanName, file.filename, nextPosition]
        );
        nextPosition += 1;

        const track = await db.queryOne<TrackRow>(
          "SELECT * FROM tracks WHERE id = ?",
          [info.lastInsertRowid]
        );
        if (track) inserted.push(track);
      }

      res.status(201).json({ tracks: inserted.map(serializeTrack) });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/admin/tracks/:id - rename a track
adminRouter.put("/tracks/:id", async (req, res, next) => {
  try {
    const existing = await db.queryOne<TrackRow>(
      "SELECT * FROM tracks WHERE id = ?",
      [req.params.id]
    );

    if (!existing) return res.status(404).json({ error: "Track not found." });

    const { title } = req.body as { title?: string };
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Track title cannot be empty." });
    }

    const cleanTitle = fixUtf8Encoding(title.trim());

    await db.execute("UPDATE tracks SET title = ? WHERE id = ?", [
      cleanTitle,
      existing.id,
    ]);

    const track = await db.queryOne<TrackRow>(
      "SELECT * FROM tracks WHERE id = ?",
      [existing.id]
    );
    res.json({ track: serializeTrack(track!) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/albums/:id/tracks/reorder - persist a new track order
adminRouter.put("/albums/:id/tracks/reorder", async (req, res, next) => {
  try {
    const { orderedTrackIds } = req.body as { orderedTrackIds?: number[] };

    if (!Array.isArray(orderedTrackIds)) {
      return res.status(400).json({ error: "orderedTrackIds must be an array." });
    }

    for (let index = 0; index < orderedTrackIds.length; index++) {
      const trackId = orderedTrackIds[index];
      await db.execute(
        "UPDATE tracks SET position = ? WHERE id = ? AND album_id = ?",
        [index, trackId, req.params.id]
      );
    }

    const tracks = await db.queryAll<TrackRow>(
      "SELECT * FROM tracks WHERE album_id = ? ORDER BY position ASC",
      [req.params.id]
    );

    res.json({ tracks: tracks.map(serializeTrack) });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/tracks/:id/replace - swap in a new MP3 file for an existing track
adminRouter.post(
  "/tracks/:id/replace",
  async (req, res, next) => {
    try {
      const track = await db.queryOne<TrackRow>(
        "SELECT * FROM tracks WHERE id = ?",
        [req.params.id]
      );
      if (!track) return res.status(404).json({ error: "Track not found." });
      req.params.albumId = String(track.album_id);
      next();
    } catch (err) {
      next(err);
    }
  },
  upload.single("track"),
  async (req, res, next) => {
    try {
      const existing = await db.queryOne<TrackRow>(
        "SELECT * FROM tracks WHERE id = ?",
        [req.params.id]
      );
      if (!existing) return res.status(404).json({ error: "Track not found." });

      if (!req.file) return res.status(400).json({ error: "No MP3 file received." });

      await deleteFromStorage("songs", existing.album_id, existing.filename);
      await uploadToStorage(req.file, "songs", existing.album_id);

      await db.execute("UPDATE tracks SET filename = ? WHERE id = ?", [
        req.file.filename,
        existing.id,
      ]);

      const track = await db.queryOne<TrackRow>(
        "SELECT * FROM tracks WHERE id = ?",
        [existing.id]
      );
      res.json({ track: serializeTrack(track!) });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/admin/tracks/:id
adminRouter.delete("/tracks/:id", async (req, res, next) => {
  try {
    const existing = await db.queryOne<TrackRow>(
      "SELECT * FROM tracks WHERE id = ?",
      [req.params.id]
    );

    if (!existing) return res.status(404).json({ error: "Track not found." });

    await db.execute("DELETE FROM tracks WHERE id = ?", [existing.id]);
    await deleteFromStorage("songs", existing.album_id, existing.filename);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
