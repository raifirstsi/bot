import { createServer } from "node:http";

createServer((request, response) => {
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify({
    host: request.headers.host,
    realIp: request.headers["x-real-ip"] ?? null,
    forwardedFor: request.headers["x-forwarded-for"] ?? null,
    forwardedProto: request.headers["x-forwarded-proto"] ?? null,
    cloudflareIp: request.headers["cf-connecting-ip"] ?? null,
  }));
}).listen(18110, "127.0.0.1");
