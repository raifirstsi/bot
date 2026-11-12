#!/usr/bin/env bash
set -euo pipefail

stage=/root/rai2-sso-stage
archive=rai2-saas-0.1.151-6f3bd3efb76ed6e2.tgz
target=/opt/rai2/releases/saas-6f3bd3efb76ed6e2
current=/opt/rai2/current/saas
previous=$(readlink -f "$current")
activated=0

rollback() {
  status=$?
  if (( status != 0 && activated == 1 )); then
    ln -s "$previous" "${current}.rollback"
    mv -Tf "${current}.rollback" "$current"
    systemctl restart rai2-saas || true
    printf 'SaaS release reverted to %s\n' "$previous" >&2
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
test -f "$target/saas/main.mjs"
ln -s "$target/saas" "${current}.next"
mv -Tf "${current}.next" "$current"
activated=1
systemctl restart rai2-saas
healthy=0
for attempt in {1..20}; do
  if curl -fsS --max-time 3 -H 'Host: app.rai2.si' http://127.0.0.1:8812/healthz >/dev/null; then
    healthy=1
    break
  fi
  sleep 1
done
test "$healthy" -eq 1
printf 'SaaS release active: %s\n' "$(readlink -f "$current")"
