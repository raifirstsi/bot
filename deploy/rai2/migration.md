# Shared VPS migration plan

The first stage can run behind the existing Nginx instance. A later move to a
dedicated VPS keeps the customer data and tenant names; it does not require a
new account model.

## Before the move

1. Provision Ubuntu 24.04 or newer, install Node 24, Nginx, Caddy, nftables
   and the same RAI2 runtime archive. Retain the internal-edge mode and run
   `preflight.sh --shared` on the target before creating a fleet.
2. Create encrypted backups of `/var/lib/rai2/saas`,
   `/var/lib/openmausbot`, `/etc/openmausbot/fleet.json`,
   `/etc/openmausbot/instances`, and the operator-managed brand/config files.
   Test restoring them into a disposable host.
3. Lower DNS TTL for `app.rai2.si` and `*.rai2.si` at least one day before the
   cutover. Keep the same certificate coverage and SaaS origin.

## Cutover

1. Stop new orders and announce a short maintenance window. Stop the SaaS
   service and fleet mutations on the old host; do not delete its data.
2. Copy the final SQLite database with its `-wal` and `-shm` files while the
   service is stopped. Restore tenant homes, fleet registry, instance files,
   and the reviewed runtime archive on the target with the original owners and
   modes.
3. Verify the restored SaaS database is present before starting the service.
   A missing database is a failed restore; do not initialize a blank one.
4. Run the isolated health, workspace and payment fixture checks on the target.
   Verify `/healthz`, one synthetic tenant, and a synthetic SePay notification
   before changing DNS.
5. Change the Cloudflare records to the target IP, wait for the health checks,
   then reopen orders. Keep the old host stopped but recoverable until a full
   backup and one paid renewal have been verified.

## Scaling beyond one VPS

The current SQLite control plane and fleet registry are single-host state. To
use multiple hosts, keep one control plane and add a host-aware provisioner,
per-host fleet agents, a durable database with locking, and a routing record
for each tenant. Do not point two active control planes at the same SQLite
file or let two fleet agents mutate one registry.
