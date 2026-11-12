# RAI2 SaaS control plane

The control plane gives each verified new email one 14-day BYOK trial, then
sells a workspace for 299,000 VND per month. It keeps
accounts, one-time email codes, browser sessions, invoices and SePay receipts in
its own SQLite database. A confirmed payment requests one isolated workspace
through the existing Linux fleet agent. Each workspace runs as a separate OS
user with its own data directory, ports and hostname. Trial expiry or a missed
renewal suspends the service but keeps its data. No automatic deletion runs.
The shared VPS reserves at most four simultaneous workspace slots; when all
are occupied, a new email receives a capacity message after OTP verification
and no workspace or payment order is issued.

The public landing at `https://rai2.si/` is served as static HTML and assets
from the versioned SaaS bundle by Nginx (`deploy/rai2/nginx-apex-landing.conf`).
Account sign-in, OTP, checkout and
workspace management remain at `https://app.rai2.si/` in the SaaS control
plane. Landing CTAs link to that account portal; neither host uses the former
instant-access, guest or unverified trial routes.

The control plane never issues an OpenMausBot runtime session. After trial
activation or payment, the account portal creates a 60-second, single-use
handoff bound to the owner's session and workspace. The workspace consumes it
over a tenant-authenticated backchannel and issues its own host-only session.
Opening a workspace directly without a session returns to the portal, which
opens the entitled workspace after account sign-in. The fleet creates that
workspace with only the owner's address in `signIn.admins`, no members, and a
tenant-scoped token. Email OTP remains available at the workspace as a
recovery sign-in. The SMTP credential stays only in the control plane.
The API returns a workspace URL only after the fleet confirms it is running.
Payment during a trial adds one month after the trial's end. An email cannot
restart its trial by signing in again.

An account owner may choose a friendly workspace address such as
`an-phat.rai2.si`. The immutable `u-…` slug remains the tenant identity for its
Unix user, data directory, fleet registry and signing key. Changing the public
address updates only the runtime origin and Caddy routes. The opaque address
and up to eight prior friendly addresses redirect to the current address; old
friendly handles remain reserved so another account cannot take them. Handles
are lowercase DNS labels of 3–30 characters and may be changed once per hour.
The control plane restores the previous database value if the fleet mutation
fails, while the fleet agent restores the previous environment, Caddy route
and registry before reporting that failure.

For a private preview, use a systemd override modeled on
`deploy/rai2/preview.conf.example`. `RAI2_SAAS_PREVIEW_EMAIL` limits OTP and
sessions to one owner address. Payments default to disabled in the production
entry point; `/api/orders`, payment QR and SePay webhooks refuse requests
until `RAI2_SAAS_PAYMENTS_ENABLED=1` is set after release verification. The
public `/api/status` endpoint lets the account UI hide payment controls.

## Build and verify

Use Node 24 and the repository's pinned pnpm dependencies:

```sh
pnpm saas:check
pnpm saas:test
pnpm saas:smoke
pnpm package:rai2
node scripts/smoke-oss-server.mjs
```

The runtime archive under `release/` contains no `enterprise/` directory and
ships `LICENSE`, `NOTICE` and the third-party license files. The separate
`dist-saas/` bundle contains its own `LICENSE` and `NOTICE`. Never use the
repository's default `build:server` or upstream Docker image as a RAI2 release.

## Linux deployment

This deployment has not been qualified for production. Complete
`docs/verification/saas.md` before taking customer payments. On the current
shared VPS, Nginx owns ports 80/443 and Caddy listens only on
`127.0.0.1:8081`. Run `sudo bash deploy/rai2/preflight.sh --shared` before
the initial fleet setup. The default fleet mode still expects Caddy to own
public ports; keep `--internal-edge --control-plane-port 8812` for this host.

1. Install Node 24, Caddy, nftables and the pinned RAI2 runtime archive. Give
   the control plane a dedicated `rai2` Unix user; install the runtime with
   `npm install -g --ignore-scripts /opt/rai2/releases/<archive>.tgz`.
2. Run `rai2 fleet init --domain rai2.si --operator rai2 --internal-edge
   --control-plane-port 8812 --node /opt/rai2/node/bin/node --script
   /opt/rai2/node/lib/node_modules/@raifirst/rai2-runtime/bin/rai2.mjs`
   once. Inspect the generated systemd unit, fence and Caddy import before
   enabling them.
3. Place `dist-saas/` at `/opt/rai2/current/saas`, owned by root and not
   writable by `rai2`. Place `deploy/rai2/rai2-saas.service` in
   `/etc/systemd/system/`, and make `/var/lib/rai2/saas` writable only by
   `rai2`.
4. Put the values from `deploy/rai2/saas.env.example` into
   `/etc/rai2/saas.env`, owned by `root:rai2` with mode `0640` so only root
   and the SaaS service user can read it. Percent-encode SMTP credentials
   inside the URL. Keep the tenant signing key distinct from the OTP pepper;
   back up both. Set the bank account and SePay HMAC secret to the values
   selected in the webhook integration. SePay shows the HMAC secret only once;
   keep it out of chat and source control.
   Run the one-time `RAI2_SAAS_DATA_DIR=/var/lib/rai2/saas
   /opt/rai2/node/bin/node /opt/rai2/current/saas/init.mjs` as the `rai2` user before starting
   the service. Initialization refuses an existing database. A later missing
   database is a restore incident and the service will not create a blank one.
5. Configure Caddy with `deploy/rai2/Caddyfile` and keep Nginx as the public
   TLS edge using `deploy/rai2/nginx-shared.conf.example`; Caddy listens only
   on `127.0.0.1:8081`. Cloudflare DNS must route `app.rai2.si` and
   `*.rai2.si` to the VPS. Use Full (strict) TLS, a certificate covering both
   names, and verify the proxy before enabling payment. Restrict direct origin
   traffic to Cloudflare and administrative access to trusted IPs.
6. Configure a SePay HMAC-SHA256 JSON webhook at
   `https://app.rai2.si/api/webhooks/sepay`. The handler verifies the
   `X-SePay-Signature` over the raw body with the `X-SePay-Timestamp` within
   five minutes, the configured receiving account, an incoming transfer, a
   unique SePay transaction `id`, one order code, and exactly 299,000 VND.
   It returns SePay's required `{"success":true}` envelope. Production refuses
   to enable payments without the HMAC secret.
7. Start `rai2-saas.service` and verify `/healthz` plus one synthetic account
   and payment in an isolated staging environment. Never send a forged webhook
   to the production endpoint to test it.

To upgrade all tenants, stage and inspect the new archive, verify its SHA-256,
then run `rai2 fleet upgrade --release-file /opt/rai2/releases/<archive>.tgz
--sha256 <verified-digest>`.
The command no longer installs upstream `openmausbot@latest`.

## Operations

Keep the SaaS SQLite file, its WAL files and each tenant's home in separate
encrypted backups. Verify restoration into an isolated host before relying on
backups. Monitor `/healthz`, fleet states, tenant health and payment-to-workspace
latency. A fleet reservation in `error` or `provisioning` requires operator
inspection; the control plane will not delete or reuse that home.

The paid period uses calendar months in UTC and retains the initial billing day
through shorter months. A pending transfer code expires after 24 hours. The
initial shared host reserves at most four workspace slots; existing paid
workspaces retain their slot through suspension and each tenant has a 2 GB
systemd memory limit. Duplicate
SePay transaction ids are credited once. Any transfer that cannot be matched
is recorded as unmatched. Inspect it with
`RAI2_SAAS_DATA_DIR=/var/lib/rai2/saas node /opt/rai2/current/saas/reconcile.mjs list`.
After independently checking the bank transaction and customer order, assign
it once with `... reconcile.mjs assign sepay:TRANSACTION_ID R2ORDER_CODE`.
Only a transfer of exactly 299,000 VND can be assigned to one order. SePay bank
transfers are manual monthly renewals, not automatic card debits.

The account portal supports Vietnamese and English. Its sign-in email includes
both languages. The frontend and control plane are RAI2-branded. Protocol identifiers such as
`/.well-known/openmausbot/environment`, `openmausbot://` and health's `app`
remain unchanged for client compatibility. They are not a grant to market the
upstream trademarks or mascot as RAI2's own.

For moving the shared installation to a dedicated VPS later, follow
`deploy/rai2/migration.md`. Keep one active control plane and one fleet agent
for the SQLite registry; multi-VPS scaling needs a durable database and
host-aware routing layer.
