#!/usr/bin/env bash
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  printf '%s\n' 'Run this preflight as root.' >&2
  exit 1
fi

mode=dedicated
if [[ ${1:-} == "--shared" ]]; then mode=shared; fi
if [[ ${1:-} != "" && ${1:-} != "--shared" ]]; then
  printf '%s\n' 'Usage: preflight.sh [--shared]' >&2
  exit 1
fi

if [[ ! -r /etc/os-release ]]; then
  printf '%s\n' 'Cannot read the Linux OS release.' >&2
  exit 1
fi
. /etc/os-release
if [[ ${ID:-} != ubuntu ]] || ! dpkg --compare-versions "${VERSION_ID:-0}" ge 24.04; then
  printf '%s\n' 'RAI2 deployment requires Ubuntu 24.04 or newer.' >&2
  exit 1
fi

if [[ -e /etc/openmausbot/fleet.json ]]; then
  printf '%s\n' 'An OpenMausBot fleet already exists on this host.' >&2
  exit 1
fi

listeners=$(ss -H -ltn '( sport = :80 or sport = :443 )')
if [[ $mode == dedicated && -n $listeners ]]; then
  printf '%s\n' 'Ports 80 or 443 are already in use. Use a dedicated VPS before running fleet init.' >&2
  printf '%s\n' "$listeners" >&2
  exit 1
fi
if [[ $mode == shared ]]; then
  if ! command -v nginx >/dev/null || [[ -z $listeners ]]; then
    printf '%s\n' 'Shared mode requires an existing Nginx listener on ports 80 or 443.' >&2
    exit 1
  fi
  if ss -H -ltn '( sport = :8081 or sport = :8812 )' | grep -q .; then
    printf '%s\n' 'Shared RAI2 ports 8081 or 8812 are already in use.' >&2
    ss -H -ltn '( sport = :8081 or sport = :8812 )' >&2
    exit 1
  fi
fi

printf 'RAI2 preflight passed (%s mode): Ubuntu version, fleet state and web ports are ready.\n' "$mode"
