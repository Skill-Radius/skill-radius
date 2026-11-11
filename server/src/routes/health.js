import { Router } from "express";
import { dbState } from "../db.js";

const started = Date.now();
export const health = Router();

// Liveness: the process is up. Render calls this to decide whether the service is healthy.
health.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "skillradius-api", uptimeSeconds: Math.round((Date.now() - started) / 1000), database: dbState() });
});

// Readiness: the API can actually serve data.
health.get("/ready", (_req, res) => {
  const ok = dbState() === "connected";
  res.status(ok ? 200 : 503).json({ ready: ok, database: dbState() });
});
