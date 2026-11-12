#!/usr/bin/env bash
set -euo pipefail

if [[ $EUID -ne 0 || $# -ne 2 || $1 != /* || $2 != /* || ! -f $2 || -e $1 ]]; then
  printf '%s\n' 'Usage as root: backup.sh /absolute/new-backup.tar.gz.age /absolute/ssh-recipient.pub' >&2
  exit 1
fi

output=$1
recipient=$2
umask 077
install -d -m 700 /var/backups/rai2
scratch=$(mktemp -d /var/backups/rai2/backup.XXXXXXXX)
trap 'rm -rf -- "$scratch"' EXIT

install -d -m 700 "$scratch/var/lib/rai2/saas" "$scratch/var/lib" "$scratch/etc/nginx/sites-available" \
  "$scratch/etc/systemd/system" "$scratch/etc/letsencrypt/renewal" "$scratch/etc/letsencrypt/live" \
  "$scratch/etc/letsencrypt/archive"

sqlite3 /var/lib/rai2/saas/saas.db ".backup '$scratch/var/lib/rai2/saas/saas.db'"
check=$(sqlite3 "$scratch/var/lib/rai2/saas/saas.db" 'PRAGMA quick_check;')
[[ $check == ok ]] || { printf '%s\n' 'SQLite backup failed integrity check' >&2; exit 1; }

cp -a /var/lib/openmausbot "$scratch/var/lib/"
cp -a /etc/rai2 /etc/openmausbot /etc/caddy "$scratch/etc/"
cp -a /etc/nginx/sites-available/rai2-saas-shared "$scratch/etc/nginx/sites-available/"
cp -a /etc/nginx/sites-available/rai2-apex-redirect "$scratch/etc/nginx/sites-available/"
cp -a /etc/systemd/system/rai2-saas.service /etc/systemd/system/rai2-saas.service.d \
  /etc/systemd/system/openmausbot@.service /etc/systemd/system/openmausbot-fleet.service \
  /etc/systemd/system/openmausbot-fence.service "$scratch/etc/systemd/system/"
cp -a /etc/letsencrypt/rai2 "$scratch/etc/letsencrypt/"
cp -a /etc/letsencrypt/renewal/app.rai2.si.conf "$scratch/etc/letsencrypt/renewal/"
cp -a /etc/letsencrypt/renewal/rai2.si.conf "$scratch/etc/letsencrypt/renewal/"
cp -a /etc/letsencrypt/live/app.rai2.si "$scratch/etc/letsencrypt/live/"
cp -a /etc/letsencrypt/live/rai2.si "$scratch/etc/letsencrypt/live/"
cp -a /etc/letsencrypt/archive/app.rai2.si "$scratch/etc/letsencrypt/archive/"
cp -a /etc/letsencrypt/archive/rai2.si "$scratch/etc/letsencrypt/archive/"

tar -C "$scratch" -czf - . | age -R "$recipient" -o "$output"
test -s "$output"
sha256sum "$output"
