#!/usr/bin/env bash
set -euo pipefail

stage=/root/rai2-sso-stage
name=rai2-sso-fixture
runtime=rai2-runtime-0.1.151-dc7bd139522ba054.tgz
source=rai2-sso-fixture.tar.gz

test -f "$stage/$runtime"
test -f "$stage/$source"
if docker container inspect "$name" >/dev/null 2>&1; then
  printf 'Fixture container already exists\n' >&2
  exit 1
fi
docker run -d --name "$name" --privileged --cgroupns=host --network none \
  --tmpfs /run --tmpfs /run/lock --tmpfs /tmp \
  -v /sys/fs/cgroup:/sys/fs/cgroup:rw \
  -v /opt/rai2/node:/opt/rai2/node:ro \
  -v "$stage:/stage:ro" rai2-systemd-fixture:20261112 >/dev/null
cleanup() {
  status=$?
  if (( status != 0 )); then
    docker inspect --format '{{.State.Status}} {{.State.ExitCode}}' "$name" || true
    docker logs --tail 30 "$name" || true
  fi
  docker rm -f "$name" >/dev/null
  exit "$status"
}
trap cleanup EXIT
docker exec "$name" bash -c \
  'mkdir -p /opt/fixture/source && tar -xzf /stage/rai2-runtime-0.1.151-dc7bd139522ba054.tgz -C /opt/fixture && tar -xzf /stage/rai2-sso-fixture.tar.gz -C /opt/fixture/source'
docker exec "$name" /opt/rai2/node/bin/node \
  /opt/fixture/source/scripts/verify-rai2-systemd-fleet.mjs \
  /opt/fixture/package/bin/rai2.mjs
