/**
 * Cloudflare Worker: Data Sync
 * Persists dashboard state (homework, wishlist, way, positions) in KV.
 *
 * Secrets: SYNC_TOKEN  (Bearer token for auth)
 * KV:      USER_DATA   (namespace binding)
 *
 * Endpoints:
 *   GET  /sync        → returns all stored keys
 *   GET  /sync/:key   → returns value for key
 *   POST /sync/:key   → saves value for key (body: any JSON)
 *   DELETE /sync/:key → deletes key
 */

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function resp(body, status = 200) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers: CORS });
}

function unauthorized() {
  return resp({ error: "Unauthorized" }, 401);
}

function isAuthorized(request, env) {
  const auth = request.headers.get("Authorization") || "";
  return auth === `Bearer ${env.SYNC_TOKEN}`;
}

// Browser requests must come from the dashboard origin (production + Pages previews) or localhost.
// Non-browser callers (no Origin header) still pass — the Bearer token is the primary gate.
function isAllowedOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  return origin.endsWith("dimitriyak.pages.dev") || origin.startsWith("http://localhost");
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    if (!isAllowedOrigin(request)) return resp({ error: "Forbidden origin" }, 403);
    if (!isAuthorized(request, env)) return unauthorized();

    const url = new URL(request.url);
    // /sync/:key  or  /sync
    const parts = url.pathname.replace(/^\//, "").split("/");
    // parts[0] = "sync", parts[1] = key (optional)
    const key = parts[1];

    // GET /sync → list all keys with metadata
    if (request.method === "GET" && !key) {
      const list = await env.USER_DATA.list();
      const result = {};
      await Promise.all(list.keys.map(async k => {
        result[k.name] = await env.USER_DATA.get(k.name, { type: "json" });
      }));
      return resp({ data: result, updatedAt: new Date().toISOString() });
    }

    // GET /sync/:key → get single value
    if (request.method === "GET" && key) {
      const value = await env.USER_DATA.get(key, { type: "json" });
      if (value === null) return resp({ error: "Not found" }, 404);
      return resp({ key, value, updatedAt: new Date().toISOString() });
    }

    // POST /sync/:key → save value
    if (request.method === "POST" && key) {
      const body = await request.json();
      await env.USER_DATA.put(key, JSON.stringify(body));
      return resp({ ok: true, key, savedAt: new Date().toISOString() });
    }

    // DELETE /sync/:key → delete value
    if (request.method === "DELETE" && key) {
      await env.USER_DATA.delete(key);
      return resp({ ok: true, key });
    }

    return resp({ error: "Not found" }, 404);
  },
};
