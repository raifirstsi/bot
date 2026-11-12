#!/bin/sh
set -eu

case "${RENEWED_LINEAGE:-}" in
    /etc/letsencrypt/live/app.rai2.si|/etc/letsencrypt/live/rai2.si) ;;
    *) exit 0 ;;
esac

nginx -t
systemctl reload nginx
