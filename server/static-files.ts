// The desktop bundle served from OMB_STATIC_DIR: content types, cache rules and the SPA fallback.
import { readFileSync, statSync } from "node:fs";
import type { ServerResponse } from "node:http";
import { extname, join } from "node:path";

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
};

/** Never framed (a hidden frame could act on a pair or sign-in page unseen), and no Referer. */
const PAGE_HEADERS = {
  "content-security-policy": "frame-ancestors 'none'",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
} as const;

/** Pages with an entry of their own: the app, and the desktop window's rail of places. */
const PAGES: Record<string, string> = { "/": "/index.html", "/rail": "/rail.html" };

// In-memory cache for ultra-fast static file delivery without disk thrashing
const CACHE = new Map<string, { data: Buffer; mtimeMs: number }>();

function readCached(file: string): Buffer | null {
  try {
    const stat = statSync(file);
    const cached = CACHE.get(file);
    if (cached && cached.mtimeMs === stat.mtimeMs) {
      return cached.data;
    }
    const data = readFileSync(file);
    CACHE.set(file, { data, mtimeMs: stat.mtimeMs });
    return data;
  } catch {
    return null;
  }
}

/** Public by design: the same bundle anyone can download, with no secrets, and /pair must load before a session exists. */
export function serveStatic(res: ServerResponse, path: string, staticDir: string | null): boolean {
  if (!staticDir) return false;
  const safe = PAGES[path] ?? path.replace(/\.\./g, "");
  const file = join(staticDir, safe);
  
  const data = readCached(file);
  if (data) {
    const type = MIME[extname(file)] ?? "application/octet-stream";
    // Vite content-hashes every file under /assets/, so those URLs are immutable while public/ has no assets/ dir.
    const cache =
      type === "text/html"
        ? "no-cache"
        : safe.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : "public, max-age=86400";
    res.writeHead(200, {
      "content-type": type,
      ...(type === "text/html" ? PAGE_HEADERS : {}),
      ...(cache ? { "cache-control": cache } : {}),
    });
    res.end(data);
    return true;
  }

  // SPA fallback, never immutable: a missing chunk answered with the page must not stay cached under the chunk's URL.
  const fallback = readCached(join(staticDir, "index.html"));
  if (fallback) {
    res.writeHead(200, { "content-type": "text/html", "cache-control": "no-cache", ...PAGE_HEADERS });
    res.end(fallback);
    return true;
  }

  return false;
}
