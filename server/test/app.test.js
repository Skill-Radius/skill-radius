import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";

const quiet = { info() {}, warn() {}, error() {} };
let server, base;

before(async () => {
  const app = createApp(loadConfig({ NODE_ENV: "production", CORS_ORIGINS: "https://skillradius.in" }), quiet);
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

test("health reports ok and the database state", async () => {
  const r = await fetch(base + "/health"); const b = await r.json();
  assert.equal(r.status, 200); assert.equal(b.status, "ok"); assert.equal(b.database, "not_configured");
});

test("ready is 503 until a database is connected", async () => {
  const r = await fetch(base + "/ready");
  assert.equal(r.status, 503); assert.equal((await r.json()).ready, false);
});

test("API root answers", async () => {
  const r = await fetch(base + "/api/v1/");
  assert.equal(r.status, 200); assert.equal((await r.json()).version, "v1");
});

test("unknown routes return a JSON 404", async () => {
  const r = await fetch(base + "/api/v1/nope"); const b = await r.json();
  assert.equal(r.status, 404); assert.equal(b.error.code, "not_found");
});

test("the site's origin is allowed, others are refused", async () => {
  const ok = await fetch(base + "/api/v1/", { headers: { Origin: "https://skillradius.in" } });
  assert.equal(ok.headers.get("access-control-allow-origin"), "https://skillradius.in");
  const bad = await fetch(base + "/api/v1/", { headers: { Origin: "https://evil.example" } });
  assert.equal(bad.status, 403); assert.equal((await bad.json()).error.code, "origin_not_allowed");
});

test("broken JSON gets a clear 400, without a stack trace", async () => {
  const r = await fetch(base + "/api/v1/", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{oops" });
  assert.equal(r.status, 400); assert.equal((await r.json()).error.code, "bad_json");
});

test("security headers are set and Express is not advertised", async () => {
  const r = await fetch(base + "/health");
  assert.equal(r.headers.get("x-powered-by"), null); assert.ok(r.headers.get("x-content-type-options"));
});

test("config rejects a bad port and a bad database address", () => {
  assert.throws(() => loadConfig({ PORT: "abc" })); assert.throws(() => loadConfig({ MONGODB_URI: "http://nope" }));
});
