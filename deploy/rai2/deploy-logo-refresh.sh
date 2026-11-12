#!/usr/bin/env bash
set -euo pipefail

stage=/root/rai2-sso-stage
archive=rai2-saas-0.1.151-a1a2e8e460568b2a.tgz
target=/opt/rai2/releases/saas-a1a2e8e460568b2a
current=/opt/rai2/current/saas
previous=$(readlink -f "$current")
activated=0

rollback() {
  status=$?
  if (( status != 0 && activated == 1 )); then
    ln -s "$previous" "${current}.rollback"
    mv -Tf "${current}.rollback" "$current"
    systemctl restart rai2-saas || true
    printf 'Logo refresh reverted to %s\n' "$previous" >&2
  fi
  exit "$status"
}
trap rollback EXIT

[[ $previous == /opt/rai2/releases/saas-56b0d744324c2b37/saas ]]
cd "$stage"
sha256sum -c "${archive}.sha256"
test ! -e "$target"
install -d -m 755 "$target"
tar -xzf "$archive" -C "$target"
chown -R root:root "$target"
for file in main.mjs init.mjs reconcile.mjs public/app.js; do
  cmp "$previous/$file" "$target/saas/$file"
done
ln -s "$target/saas" "${current}.next"
mv -Tf "${current}.next" "$current"
activated=1
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
landing=$(curl -fsS --max-time 8 --resolve rai2.si:443:127.0.0.1 https://rai2.si/)
account=$(curl -fsS --max-time 8 --resolve app.rai2.si:443:127.0.0.1 https://app.rai2.si/)
grep 'landing.css?v=20261112-logo2' <<<"$landing" >/dev/null
grep 'app.css?v=20261112-logo2' <<<"$account" >/dev/null
css=$(curl -fsS --max-time 8 --resolve rai2.si:443:127.0.0.1 'https://rai2.si/landing.css?v=20261112-logo2')
grep 'width: 60px' <<<"$css" >/dev/null
grep 'width: 54px' <<<"$css" >/dev/null
printf 'Logo refresh active: %s\n' "$(readlink -f "$current")"
