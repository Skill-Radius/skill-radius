import { loadConfig } from "./config.js";
import { createApp } from "./app.js";
import { connectDb, closeDb } from "./db.js";

const config = loadConfig();
const app = createApp(config);

const server = app.listen(config.port, () => console.info(`[api] listening on port ${config.port} (${config.nodeEnv})`));
connectDb(config.mongoUri);

// Finish in-flight requests before Render stops the instance on a redeploy.
const shutdown = (signal) => {
  console.info(`[api] ${signal} received, shutting down`);
  server.close(async () => { await closeDb(); process.exit(0); });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
