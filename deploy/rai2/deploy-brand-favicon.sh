#!/usr/bin/env bash
set -euo pipefail

stage=/root/rai2-sso-stage
archive=rai2-saas-0.1.151-56b0d744324c2b37.tgz
target=/opt/rai2/releases/saas-56b0d744324c2b37
current=/opt/rai2/current/saas
nginx_site=/etc/nginx/sites-available/rai2-saas-shared
previous=$(readlink -f "$current")
activated=0
changed_proxy=0

rollback() {
  status=$?
  if (( status != 0 )); then
    if (( activated == 1 )); then
      ln -s "$previous" "${current}.rollback"
      mv -Tf "${current}.rollback" "$current"
      systemctl restart rai2-saas || true
    fi
    if (( changed_proxy == 1 )); then
      cp -a "$stage/nginx-shared.previous" "$nginx_site"
      nginx -t >/dev/null && systemctl reload nginx
    fi
    printf 'Brand favicon release rolled back\n' >&2
  fi
  exit "$status"
}
trap rollback EXIT

cd "$stage"
sha256sum -c "${archive}.sha256"
printf '%s  %s\n' \
  e2232b241438636043e3e412501754b676327e01520cc7a3a5fe8565491d7b8b "$nginx_site" | sha256sum -c -
if [[ ! -e $target ]]; then
  install -d -m 755 "$target"
  tar -xzf "$archive" -C "$target"
  chown -R root:root "$target"
fi
for file in main.mjs init.mjs reconcile.mjs public/app.js; do
  cmp "$previous/$file" "$target/saas/$file"
done
cp -a "$nginx_site" "$stage/nginx-shared.previous"
cp "$stage/nginx-shared.conf.example" "$nginx_site"
changed_proxy=1
nginx -t >/dev/null
ln -s "$target/saas" "${current}.next"
mv -Tf "${current}.next" "$current"
activated=1
systemctl reload nginx
systemctl restart rai2-saas
healthy=0
for attempt in {1..20}; do
  if curl -fsS --max-time 3 -H 'Host: app.rai2.si' http://127.0.0.1:8812/healthz >/dev/null 2>&1; then
    healthy=1
    break
  fi
  sleep 1
done
test "$healthy" -eq 1
curl -fsS --max-time 8 --resolve app.rai2.si:443:127.0.0.1 https://app.rai2.si/ | grep 'rai-favicon.svg' >/dev/null
for host in rai2.si app.rai2.si; do
  for asset in rai-favicon.svg rai-favicon-32.png rai-favicon.ico rai-touch-180.png; do
    curl -fsS --max-time 8 --resolve "$host:443:127.0.0.1" \
      -o /dev/null "https://$host/assets/$asset"
  done
done
curl -fsS --max-time 8 -H 'Host: app.rai2.si' http://127.0.0.1:8812/healthz >/dev/null
printf 'Brand favicon release active: %s\n' "$(readlink -f "$current")"
