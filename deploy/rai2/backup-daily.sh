#!/usr/bin/env bash
set -euo pipefail

stamp=$(date -u +%Y-%m-%dT%H%M%SZ)
exec /usr/bin/bash /opt/rai2/deploy/backup.sh \
  "/var/backups/rai2/${stamp}.tar.gz.age" /etc/rai2/backup-recipient.pub
