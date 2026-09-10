import { NextFunction, Request, Response, Router } from "express";
import { db } from "../db";

export const statsRouter = Router();

// GET /api/stats/visitors - Return current visitor count
statsRouter.get("/visitors", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const row = await db.queryOne<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'visitor_count'"
    );
    const count = row ? parseInt(row.value, 10) || 0 : 0;
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

// POST /api/stats/visit - Record a new visitor session and return updated count
statsRouter.post("/visit", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const row = await db.queryOne<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'visitor_count'"
    );
    const currentCount = row ? parseInt(row.value, 10) || 0 : 0;
    const newCount = currentCount + 1;

    if (row) {
      await db.execute(
        "UPDATE settings SET value = ? WHERE key = 'visitor_count'",
        [String(newCount)]
      );
    } else {
      await db.execute(
        "INSERT INTO settings (key, value) VALUES ('visitor_count', ?)",
        [String(newCount)]
      );
    }

    res.json({ count: newCount });
  } catch (err) {
    next(err);
  }
});
