import fs from "fs";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { env } from "../env";

export const s3Client = env.isR2Configured
  ? new S3Client({
      region: "auto",
      endpoint: env.r2Endpoint,
      credentials: {
        accessKeyId: env.r2AccessKeyId!,
        secretAccessKey: env.r2SecretAccessKey!,
      },
    })
  : null;

export async function uploadToStorage(
  file: Express.Multer.File,
  prefix: "covers" | "songs",
  albumId: number | string
): Promise<{ key: string; url: string }> {
  const key = `${prefix}/${albumId}/${file.filename}`;

  if (s3Client && env.r2BucketName) {
    const fileStream = fs.createReadStream(file.path);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.r2BucketName,
        Key: key,
        Body: fileStream,
        ContentType: file.mimetype,
      })
    );
  }

  const url = getStorageUrl(prefix, albumId, file.filename);
  return { key, url };
}

export async function deleteFromStorage(
  prefix: "covers" | "songs",
  albumId: number | string,
  filename: string
): Promise<void> {
  const key = `${prefix}/${albumId}/${filename}`;

  if (s3Client && env.r2BucketName) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: env.r2BucketName,
          Key: key,
        })
      );
    } catch (err) {
      console.warn(`Failed to delete ${key} from R2:`, err);
    }
  }

  // Also remove local file if present
  const localPath = path.join(env.uploadsDir, "albums", String(albumId), filename);
  if (fs.existsSync(localPath)) {
    try {
      fs.unlinkSync(localPath);
    } catch {
      // Ignore
    }
  }
}

export async function deleteAlbumStorage(albumId: number | string): Promise<void> {
  if (s3Client && env.r2BucketName) {
    for (const prefix of ["covers", "songs"] as const) {
      try {
        const list = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: env.r2BucketName,
            Prefix: `${prefix}/${albumId}/`,
          })
        );
        if (list.Contents && list.Contents.length > 0) {
          for (const item of list.Contents) {
            if (item.Key) {
              await s3Client.send(
                new DeleteObjectCommand({
                  Bucket: env.r2BucketName,
                  Key: item.Key,
                })
              );
            }
          }
        }
      } catch (err) {
        console.warn(`Failed to clean R2 files for album ${albumId}:`, err);
      }
    }
  }

  const dir = path.join(env.uploadsDir, "albums", String(albumId));
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  }
}

export function getStorageUrl(
  prefix: "covers" | "songs",
  albumId: number | string,
  filename: string
): string {
  if (!filename) return "";
  if (filename.startsWith("http://") || filename.startsWith("https://")) {
    return filename;
  }
  if (env.r2PublicUrl) {
    return `${env.r2PublicUrl}/${prefix}/${albumId}/${filename}`;
  }
  // Default to local /uploads/albums/ route which is served or proxied by backend
  return `/uploads/albums/${albumId}/${filename}`;
}

export async function getR2Stream(
  albumId: number | string,
  filename: string
): Promise<{ stream: NodeJS.ReadableStream; contentType?: string; contentLength?: number } | null> {
  if (!s3Client || !env.r2BucketName) return null;

  // Try songs/ first then covers/
  for (const prefix of ["songs", "covers"] as const) {
    const key = `${prefix}/${albumId}/${filename}`;
    try {
      const res = await s3Client.send(
        new GetObjectCommand({
          Bucket: env.r2BucketName,
          Key: key,
        })
      );
      if (res.Body) {
        return {
          stream: res.Body as NodeJS.ReadableStream,
          contentType: res.ContentType,
          contentLength: res.ContentLength,
        };
      }
    } catch {
      // Object not found in this prefix, continue
    }
  }

  return null;
}
