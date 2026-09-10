import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import multer from "multer";
import { env } from "./env";
import { migrate } from "./db";
import { authRouter } from "./routes/auth";
import { albumsRouter, tracksRouter } from "./routes/albums";
import { adminRouter } from "./routes/admin";
import { requireAuth } from "./middleware/auth";

if (!fs.existsSync(env.uploadsDir)) {
  fs.mkdirSync(env.uploadsDir, { recursive: true });
}

const app = express();

app.use(
  cors({
    origin: env.clientOrigin,
  })
);
app.use(express.json());

// Publicly served media (covers + mp3s). Range requests work out of the box
// with express.static, which is what lets the HTML5 <audio> element seek.
app.use("/uploads", express.static(env.uploadsDir));

// Fallback: If not found on local disk, stream directly from Cloudflare R2
app.get("/uploads/albums/:albumId/:filename", async (req, res, next) => {
  try {
    const { albumId, filename } = req.params;
    const { getR2Stream } = await import("./services/storage");
    const r2Data = await getR2Stream(albumId, filename);
    if (!r2Data) {
      return res.status(404).send("File not found");
    }
    if (r2Data.contentType) {
      res.setHeader("Content-Type", r2Data.contentType);
    }
    if (r2Data.contentLength) {
      res.setHeader("Content-Length", r2Data.contentLength);
    }
    res.setHeader("Cache-Control", "public, max-age=86400");
    r2Data.stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/albums", albumsRouter);
app.use("/api/tracks", tracksRouter);
app.use("/api/admin", requireAuth, adminRouter);

// 404 for unknown API routes
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));

// Centralized error handler (multer errors, JSON parse errors, etc.)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof Error) {
    console.error(err);
    return res.status(400).json({ error: err.message || "Something went wrong." });
  }
  console.error(err);
  return res.status(500).json({ error: "Internal server error." });
});

async function startServer() {
  try {
    await migrate();
    app.listen(env.port, () => {
      console.log(`Panflute Journey API listening on http://localhost:${env.port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();

