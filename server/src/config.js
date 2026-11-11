// Reads and checks settings from environment variables once, at start-up.
// Anything secret (database password, keys) lives only in the environment, never in this repo.

const list = (v) => String(v || "").split(",").map((s) => s.trim()).filter(Boolean);

export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || "development";
  const port = Number(env.PORT || 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`PORT must be a number between 1 and 65535, got "${env.PORT}"`);

  const mongoUri = (env.MONGODB_URI || "").trim();
  if (mongoUri && !/^mongodb(\+srv)?:\/\//.test(mongoUri)) throw new Error("MONGODB_URI must start with mongodb:// or mongodb+srv://");

  const corsOrigins = list(env.CORS_ORIGINS);
  if (!corsOrigins.length) corsOrigins.push("https://skillradius.in", "https://www.skillradius.in");
  if (nodeEnv !== "production") corsOrigins.push("http://localhost:8080", "http://localhost:8765");

  return Object.freeze({ nodeEnv, isProd: nodeEnv === "production", port, mongoUri, corsOrigins: [...new Set(corsOrigins)] });
}
