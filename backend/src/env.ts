import dotenv from "dotenv";
import path from "path";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwtSecret: required("JWT_SECRET", "dev-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  databasePath: path.resolve(process.env.DATABASE_PATH ?? "./data/panflute.db"),
  databaseUrl: process.env.DATABASE_URL?.trim() || undefined,
  uploadsDir: path.resolve(process.env.UPLOADS_DIR ?? "./uploads"),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 25),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",

  // Cloudflare R2
  r2Endpoint: process.env.R2_ENDPOINT?.trim() || undefined,
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID?.trim() || undefined,
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY?.trim() || undefined,
  r2BucketName: process.env.R2_BUCKET_NAME?.trim() || "panflute-journey",
  r2PublicUrl: process.env.R2_PUBLIC_URL?.trim()?.replace(/\/$/, "") || undefined,

  get isR2Configured(): boolean {
    return !!(this.r2Endpoint && this.r2AccessKeyId && this.r2SecretAccessKey);
  },
  get isPgConfigured(): boolean {
    return !!this.databaseUrl;
  },
};
