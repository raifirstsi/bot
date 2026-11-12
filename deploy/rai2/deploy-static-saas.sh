#!/usr/bin/env bash
set -euo pipefail

stage=/root/rai2-sso-stage
archive=rai2-saas-0.1.151-ea33c380c2f5836e.tgz
target=/opt/rai2/releases/saas-ea33c380c2f5836e
current=/opt/rai2/current/saas
previous=$(readlink -f "$current")
activated=0

rollback() {
  status=$?
  if (( status != 0 && activated == 1 )); then
    ln -s "$previous" "${current}.rollback"
    mv -Tf "${current}.rollback" "$current"
    printf 'Static release reverted to %s\n' "$previous" >&2
  fi
  exit "$status"
}
trap rollback EXIT

cd "$stage"
sha256sum -c "${archive}.sha256"
test ! -e "$target"
install -d -m 755 "$target"
tar -xzf "$archive" -C "$target"
chown -R root:root "$target"
for file in main.mjs init.mjs reconcile.mjs public/index.html public/app.js; do
  cmp "$previous/$file" "$target/saas/$file"
done
nginx -t >/dev/null
ln -s "$target/saas" "${current}.next"
mv -Tf "${current}.next" "$current"
activated=1
curl -fsS --max-time 8 --resolve rai2.si:443:127.0.0.1 https://rai2.si/ | grep -q 'mobile-dialog'
for asset in rai-favicon.svg rai-favicon-32.png rai-favicon.ico rai-touch-180.png; do
  curl -fsS --max-time 8 --resolve rai2.si:443:127.0.0.1 \
    -o /dev/null "https://rai2.si/assets/$asset"
done
curl -fsS --max-time 8 -H 'Host: app.rai2.si' http://127.0.0.1:8812/healthz >/dev/null
printf 'Static release active: %s\n' "$(readlink -f "$current")"
