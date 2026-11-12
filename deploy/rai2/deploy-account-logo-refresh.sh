#!/usr/bin/env bash
set -euo pipefail

stage=/root/rai2-sso-stage
current=/opt/rai2/current/saas
previous=$(readlink -f "$current")
candidate_root=/opt/rai2/releases/saas-account-logo-breakpoints-20261112
target=$candidate_root/saas
activated=0

rollback() {
  status=$?
  if (( status != 0 && activated == 1 )); then
    ln -s "$previous" "${current}.rollback"
    mv -Tf "${current}.rollback" "$current"
    systemctl restart rai2-saas || true
    printf 'Account logo refresh reverted to %s\n' "$previous" >&2
  fi
  exit "$status"
}
trap rollback EXIT

printf '%s  %s\n' 31e0450f9fbf7a20b81e7f5a6d6b584040dd070427a324d5ed07d1cb2a3b6ae6 "$previous/main.mjs" | sha256sum -c -
test ! -e "$candidate_root"
/opt/rai2/node/bin/node "$stage/transform-account-logo.mjs" "$previous" "$target"
chown -R root:root "$candidate_root"
for file in main.mjs init.mjs reconcile.mjs public/app.js public/landing.html public/landing.css public/landing.js; do
  cmp "$previous/$file" "$target/$file"
done
temporary=$stage/account-logo2-candidate.tgz
tar -czf "$temporary" -C "$candidate_root" saas
digest=$(sha256sum "$temporary" | awk '{print $1}')
archive=$stage/rai2-saas-0.1.151-${digest:0:16}.tgz
mv "$temporary" "$archive"
printf '%s  %s\n' "$digest" "${archive##*/}" >"$archive.sha256"
ln -s "$target" "${current}.next"
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
account=$(curl -fsS --max-time 8 --resolve app.rai2.si:443:127.0.0.1 https://app.rai2.si/)
grep 'app.css?v=20261112-logo2' <<<"$account" >/dev/null
css=$(curl -fsS --max-time 8 --resolve app.rai2.si:443:127.0.0.1 'https://app.rai2.si/app.css?v=20261112-logo2')
grep 'width: 60px' <<<"$css" >/dev/null
grep 'width: 54px' <<<"$css" >/dev/null
grep 'width: 50px' <<<"$css" >/dev/null
printf 'Account logo refresh active: %s\nArchive: %s\nSHA-256: %s\n' "$(readlink -f "$current")" "$archive" "$digest"
for attempt in {1..5}; do
  [[ $(readlink -f "$current") == "$target" ]]
  sleep 2
done
