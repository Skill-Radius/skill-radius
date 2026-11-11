// MongoDB connection. The API starts without a database so the service can come up
// and report its own state; anything that needs data answers 503 until it is connected.
import mongoose from "mongoose";

let state = "not_configured"; // not_configured | connecting | connected | disconnected | error

export const dbState = () => state;

export async function connectDb(uri, log = console) {
  if (!uri) { log.warn("[db] MONGODB_URI is not set. Running without a database."); return false; }
  mongoose.set("strictQuery", true);
  mongoose.connection.on("connected", () => { state = "connected"; log.info("[db] connected"); });
  mongoose.connection.on("disconnected", () => { state = "disconnected"; log.warn("[db] disconnected"); });
  mongoose.connection.on("error", (e) => { state = "error"; log.error("[db] error:", e.message); });
  state = "connecting";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, maxPoolSize: 10 });
    return true;
  } catch (e) {
    state = "error";
    log.error("[db] could not connect:", e.message);
    return false;
  }
}

export async function closeDb() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}
