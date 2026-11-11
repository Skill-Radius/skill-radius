import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { health } from "./routes/health.js";
import { notFound, errorHandler } from "./middleware/errors.js";

export function createApp(config, log = console) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1); // Render sits in front of the app; needed for correct client IPs

  app.use(helmet());
  app.use(cors({
    origin(origin, cb) {
      // No Origin header: server-to-server calls, health checks, curl.
      if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
      cb(new Error("cors_blocked"));
    },
    credentials: true,
    maxAge: 600
  }));
  app.use(express.json({ limit: "100kb" }));

  app.use(health);

  const api = express.Router();
  api.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-7", legacyHeaders: false, message: { error: { code: "rate_limited", message: "Too many requests. Please try again in a minute." } } }));
  api.get("/", (_req, res) => res.json({ name: "SkillRadius API", version: "v1" }));
  // Feature routes (accounts, catalogue, payments…) are mounted here as they are built.
  app.use("/api/v1", api);

  app.use(notFound);
  app.use(errorHandler(config.isProd, log));
  return app;
}
