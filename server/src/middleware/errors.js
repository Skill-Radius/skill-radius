// One shape for every error the API returns: { error: { code, message } }.

export class ApiError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

export const notFound = (req, _res, next) => next(new ApiError(404, "not_found", `No route for ${req.method} ${req.path}`));

// eslint-disable-next-line no-unused-vars
export const errorHandler = (isProd, log = console) => (err, req, res, _next) => {
  if (err && err.message === "cors_blocked") return res.status(403).json({ error: { code: "origin_not_allowed", message: "This site is not allowed to call the API." } });
  if (err && err.type === "entity.parse.failed") return res.status(400).json({ error: { code: "bad_json", message: "The request body is not valid JSON." } });
  if (err && err.type === "entity.too.large") return res.status(413).json({ error: { code: "too_large", message: "The request body is too large." } });
  const status = err instanceof ApiError ? err.status : 500;
  if (status >= 500) log.error(`[error] ${req.method} ${req.originalUrl}:`, err);
  res.status(status).json({ error: { code: err instanceof ApiError ? err.code : "server_error", message: status >= 500 && isProd ? "Something went wrong on our side." : err.message } });
};
