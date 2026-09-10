import fs from "fs";
import multer from "multer";
import path from "path";
import { Request } from "express";
import { env } from "../env";

const ALLOWED_AUDIO = new Set(["audio/mpeg", "audio/mp3"]);
const ALLOWED_IMAGE = new Set(["image/jpeg", "image/png", "image/webp"]);

function albumDir(albumId: string | number): string {
  const dir = path.join(env.uploadsDir, "albums", String(albumId));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function sanitizeFilename(original: string): string {
  const ext = path.extname(original);
  const base = path
    .basename(original, ext)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  return `${base || "file"}-${unique}${ext}`;
}

const storage = multer.diskStorage({
  destination: (req: Request, _file, cb) => {
    const albumId = req.params.albumId ?? req.body.albumId;
    if (!albumId) {
      cb(new Error("albumId is required to upload files."), "");
      return;
    }
    cb(null, albumDir(albumId));
  },
  filename: (_req, file, cb) => {
    cb(null, sanitizeFilename(file.originalname));
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (file.fieldname === "cover") {
    if (!ALLOWED_IMAGE.has(file.mimetype)) {
      cb(new Error("Cover must be a JPG, PNG, or WEBP image."));
      return;
    }
  } else if (file.fieldname === "tracks") {
    if (!ALLOWED_AUDIO.has(file.mimetype)) {
      cb(new Error("Tracks must be MP3 audio files."));
      return;
    }
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.maxUploadMb * 1024 * 1024,
    files: 30,
  },
});

export { albumDir };
