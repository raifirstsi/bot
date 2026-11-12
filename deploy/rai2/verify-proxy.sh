#!/usr/bin/env bash
set -euo pipefail

base=$(cd "$(dirname "$0")" && pwd)
if ss -H -ltn | grep -Eq ':(18080|18081|18110)[[:space:]]'; then
  printf '%s\n' 'RAI2 proxy fixture ports are already in use.' >&2
  exit 1
fi

scratch=$(mktemp -d /tmp/rai2-proxy-fixture.XXXXXXXX)
cleanup() {
  result=$?
  if [[ $result -ne 0 ]]; then
    for log in nginx.out nginx.log caddy.log node.log; do
      if [[ -f $scratch/$log ]]; then tail -n 12 "$scratch/$log" >&2; fi
    done
  fi
  for pid in "${nginx_pid:-}" "${caddy_pid:-}" "${node_pid:-}"; do
    if [[ -n $pid ]]; then kill "$pid" 2>/dev/null || true; wait "$pid" 2>/dev/null || true; fi
  done
  rm -rf -- "$scratch"
  exit "$result"
}
trap cleanup EXIT

sed "s|__FIXTURE_ROOT__|$scratch|g" "$base/nginx-fixture.conf" > "$scratch/nginx.conf"
nginx -t -c "$scratch/nginx.conf"
node "$base/fixture-server.mjs" > "$scratch/node.log" 2>&1 & node_pid=$!
XDG_CONFIG_HOME="$scratch" XDG_DATA_HOME="$scratch" caddy run --config "$base/caddy-fixture.conf" --adapter caddyfile > "$scratch/caddy.log" 2>&1 & caddy_pid=$!
nginx -c "$scratch/nginx.conf" -g 'daemon off;' > "$scratch/nginx.out" 2>&1 & nginx_pid=$!

for attempt in {1..30}; do
  if curl -fsS --max-time 1 -H 'Host: app.rai2.si' http://127.0.0.1:18080/ >/dev/null 2>&1; then break; fi
  sleep 0.2
done

curl -fsS --max-time 5 -H 'Host: app.rai2.si' -H 'CF-Connecting-IP: 198.51.100.8' \
  -H 'X-Real-IP: 198.51.100.9' -H 'X-Forwarded-For: 198.51.100.10' \
  http://127.0.0.1:18080/ | node -e '
    let body = "";
    process.stdin.on("data", chunk => body += chunk);
    process.stdin.on("end", () => {
      const row = JSON.parse(body);
      if (row.realIp !== "127.0.0.1" || row.forwardedFor !== "127.0.0.1" || row.forwardedProto !== "https" || row.cloudflareIp !== null) process.exit(1);
    });
  '

curl -fsS --max-time 5 -H 'Host: app.rai2.si' -H 'X-Real-IP: 203.0.113.9' \
  http://127.0.0.1:18081/ | node -e '
    let body = "";
    process.stdin.on("data", chunk => body += chunk);
    process.stdin.on("end", () => {
      const row = JSON.parse(body);
      if (row.realIp !== "203.0.113.9" || row.forwardedFor !== "203.0.113.9" || row.forwardedProto !== "https") process.exit(1);
    });
  '

printf '%s\n' 'RAI2 shared proxy fixture passed: untrusted IP headers were replaced and Caddy forwarded the trusted IP.'
