# RAI2 SaaS verification

All API tests use temporary SQLite data, a fake mailer, and a recording fleet.
No test may address `rai2.si`, a real SePay endpoint, or a live tenant home.

```sh
pnpm saas:check
pnpm saas:test
pnpm saas:smoke
pnpm i18n:check:rai2
pnpm saas:package
pnpm package:rai2
pnpm lint
node scripts/smoke-rai2-package.mjs /absolute/path/to/release/rai2-runtime-<version>-<digest>.tgz
node scripts/smoke-rai2-saas-package.mjs /absolute/path/to/release/rai2-saas-<version>-<digest>.tgz
pnpm exec vitest run server/request-auth.test.ts server/request-auth.e2e.test.ts server/sessions.test.ts server/brand.test.ts server/fleet.test.ts server/fleet-cli.test.ts server/fleet-agent.test.ts src/pair/PairPage.test.ts
```

The tests must prove:

- A new email cannot receive a runtime session before OTP verification and
  payment. A client-scoped session cannot become admin.
- No public signup, guest, hard-coded pairing, or payment route mints a runtime
  session. Older sessions minted by those routes are refused after restart.
- SePay's API key, incoming direction, receiving account, transaction id,
  unique order code and amount are validated. A duplicate receipt does not
  extend the paid period twice.
- Paid accounts get different opaque workspace slugs. A retry does not create
  another workspace. Expiration suspends without deleting data; renewal resumes.
- A tenant holds only its own sign-in token. It cannot verify another tenant's
  email, and its OTP cannot sign in to the central account portal. SMTP secrets
  never enter a tenant environment.
- The packaged runtime reports OSS edition and contains no Enterprise layer;
  the packaged control plane serves UI and refuses unauthenticated mutations.

Linux fleet isolation is not exercised by Windows test runners. On a
disposable Linux VPS, follow `docs/verification/fleet.md`: create two fixture
workspaces, verify each OS user cannot reach the other's loopback API or home,
restart both services, suspend/resume one, restore a backup, and exercise a
failed fleet provision. Use only synthetic email addresses, SMTP stub, and
synthetic SePay notifications. Record commands and results before production.

## Local evidence (2026-11-12, Asia/Saigon)

- `saas:check`: passed.
- `saas/saas.test.ts`: 5 tests passed, including OTP, SePay webhook, monthly
  date anchoring, per-account isolation, unmatched payment reconciliation and
  fleet lifecycle.
- `server/fleet.test.ts`, `server/fleet-cli.test.ts`, `server/fleet-agent.test.ts`:
  32 passed, 8 Linux-only tests skipped on Windows.
- Focused auth, account, fleet, SaaS and UI suite: 187 passed, 8 Linux-only
  tests skipped on Windows.
- Client, server and SaaS typechecks: passed. `pnpm lint`: passed.
- RAI2 English/Vietnamese locale check: passed. The runtime release UI offers
  those two languages while other translations are refreshed. The account
  portal switches language and translates account, payment, workspace and
  error states; the OTP email contains both languages.
- Packaged SaaS smoke: bundle served HTML, CSS, JS and denied unauthenticated
  account/order/webhook requests. Its archive checksum matched, and the service
  refused both a missing database and a second initialization.
- OSS runtime archive checksum matched; its CLI ran, it reported OSS edition,
  contained no Enterprise directory, included elkjs/khroma licenses, and
  packaged server smoke passed.
- SaaS archive included the Nodemailer license. Its build rejects an
  unreviewed new bundled npm dependency.
- Chrome screenshots at 1440x900 and 390x844 verified Vietnamese and English
  sign-in, payment QR and workspace states without horizontal overflow. The
  latest screenshots are in `.omb-scratch/saas-ui-bilingual-final/`.
- Runtime archive at the initial staging check:
  `rai2-runtime-0.1.151-acf43d57ddf556ed.tgz`, SHA-256
  `acf43d57ddf556ed866019a4db1b90f065795515ccb7ab936f22910c63385892`.
- SaaS archive at the initial staging check:
  `rai2-saas-0.1.151-13553c7e7affa72a.tgz`, SHA-256
  `13553c7e7affa72a215ee9a9becb48bc23e4bc0fc3e0bedc0719965d7d1ca01d`.
- `pnpm i18n:check`: failed. Many translations and their source hashes were
  already stale after the fork's broad English rebrand. This was not repaired
  by accepting unchanged translations as current.

`.github/workflows/rai2-saas.yml` repeats the OSS, auth, fleet and SaaS checks
on Linux CI. A local Windows run does not substitute for its first successful
run or the disposable VPS isolation recipe.

The operator confirmed commercial rights to RAI2's custom visual assets and
selected Vietnamese and English for this release. This evidence does not
independently verify those rights or qualify the Linux host, DNS/TLS, a real
SMTP provider, SePay delivery, restoration, upstream trademark use, or
production operation. Do not publish either staging archive as a commercial
release until those checks are resolved.

The local license review found bundled Nodemailer, elkjs and khroma and added
their license texts to the archives. The full runtime dependency and asset
inventory, upstream trademark review and Apache-2.0 modified-file notices
still require a release audit. This is not a legal sign-off.

## VPS and production observations (2026-11-12, Asia/Saigon)

- `167.86.106.149:22022` accepted the SSH handshake with its known host key,
  but offered only `publickey`; it rejected the local ED25519 key. Password
  authentication was not offered. No staging command was run on this VPS.
- The Windows console automation helpers failed to initialize, so they could
  not open a provider web console to authorize that key.
- The isolated local SaaS fixture returned `200` from `/healthz`.
- The read-only production check `https://rai2.si/api/health` returned
  `{"app":"rai2"}`. The current OSS build returns `{"app":"openmausbot"}`;
  this is evidence that the patched runtime is not deployed there.

## Linux artifact smoke (2026-11-12, Asia/Saigon)

- The SSH key was authorized and `root@167.86.106.149:22022` returned UID 0
  on Ubuntu 24.04.5 x86_64. The temporary public-key transfer URL was deleted
  after SSH succeeded.
- Both staging archives were copied into `/opt/rai2-staging`; `sha256sum -c`
  reported `OK` for each archive.
- The official `node:24-bookworm-slim` image was pulled at digest
  `sha256:dc26ae92c9fb15cf6b1d63e20f0944b2efe0f115b20e00be48fb23fceb061c54`.
  Tests ran with `--network none`, a read-only staging mount, a read-only
  container filesystem and a disposable `/tmp` tmpfs.
- The extracted runtime passed packaged server startup without `node_modules`,
  14 proxy paths, MCP, CLI doctor/bots, encrypted backup, loopback trust and
  launcher restart checks. The extracted SaaS bundle served its UI and denied
  unauthenticated account, order and webhook requests.
- `fleet init --domain example.test --operator rai2 --dry-run` completed inside
  the isolated Node 24 container and printed the planned systemd, nftables
  and Caddy changes without applying them.
- This VPS also runs Nginx on ports 80/443 and unrelated production services.
  `deploy/rai2/preflight.sh` correctly exited 1 with a port-conflict report.
  The fleet/Caddy installer was not run, no tenant was created, and no live
  service, DNS record or firewall rule was changed. The two pre-existing
  containers remained healthy and no new listener remained after the tests.
  Linux fleet isolation, SMTP, SePay and end-to-end account provisioning
  remain unqualified. The operator initially selected a separate VPS, then
  chose the shared-VPS path for the initial stage.

The shared-VPS deployment uses `fleet init --internal-edge
--control-plane-port 8812`: Caddy binds only to `127.0.0.1:8081`, Nginx
remains the public TLS edge, and the nftables fence rejects tenant users from
the internal Caddy and control-plane ports. `app.rai2.si` is the control-plane
host. Before activation, the public Nginx vhost returned 503 while the
release and verification gates were checked.

- Caddy 2.10.2 validated the internal config with `app.rai2.si` and a fixture
  workspace site. A temporary host-network proxy smoke returned the expected
  Host header for both `app.rai2.si` and `u-fixture.rai2.si`; both fixture
  containers were removed and ports 8081/8810/8812 were clear afterward.

- On the shared VPS, Node `v24.22.3` and Ubuntu Caddy `2.6.2` were installed.
  The reviewed runtime archive was installed globally with explicit Node and
  script paths. `openmausbot-fence.service`, `openmausbot-fleet.service`, and
  Caddy are active; Caddy listens only on `127.0.0.1:8081`. No tenant exists.
- The final runtime archive was copied to `/opt/rai2/releases`, verified with
  `sha256sum -c`, and passed the packaged Linux smoke in a read-only,
  network-disabled Node 24 container. It was installed globally; fleet init
  re-ran with an empty registry and retained internal-edge mode. Nginx,
  Caddy, fleet agent and fence remained active; only Caddy listens on
  `127.0.0.1:8081`.

## DNS and TLS staging (2026-11-12, Asia/Saigon)

- A zone-scoped Cloudflare API token was verified without printing it. `A`
  records for `app.rai2.si` and `*.rai2.si` were created as proxied records
  pointing to `167.86.106.149`. The apex record was not changed.
- Certbot's Cloudflare DNS plugin issued a Let's Encrypt certificate for
  `*.rai2.si`, stored as `app.rai2.si`, expiring 2027-02-10. The wildcard SAN
  covers `app.rai2.si`. `certbot renew --dry-run --cert-name app.rai2.si`
  succeeded. A deploy hook reloads Nginx only for this lineage.
- The new names use an Nginx hold vhost until SaaS is configured. `nginx -t`
  passed before reload. Both direct-origin and Cloudflare requests to
  `app.rai2.si` returned `503` with valid TLS, a fixture tenant hostname
  returned `503`, and the pre-existing `raifirst.si` site returned `200`.
- The Cloudflare zone SSL mode was not readable with the available token;
  Full (strict) must be checked before switching from the hold vhost.
- The operator's bank account field is syntactically valid and the SePay key
  field meets the configured minimum length, but neither has been verified
  against a real provider. A Resend API key was posted in chat; use a fresh
  dedicated SMTP key and rotate the exposed key before enabling SaaS.

## Internal SaaS and proxy verification (2026-11-12, Asia/Saigon)

- A fresh Resend SMTP key was placed in the Git-ignored local config. Nodemailer
  `verify()` succeeded without sending email. The operator-provided bank and
  SePay fields passed syntax checks; provider acceptance remains unverified.
- The environment was transferred without logging values to
  `/etc/rai2/saas.env` as `0640 root:rai2`. A new SQLite database was created
  once as `rai2` with mode `0600`. `rai2-saas.service` is active behind the
  public hold vhost. Direct loopback and Caddy health requests both returned
  `200 {"ok":true}`; public `app.rai2.si` still returned `503` with valid TLS.
- A disposable Nginx, Caddy and Node chain on ports 18080/18081/18110
  verified that an untrusted client cannot supply a fake source IP through
  Nginx, while Caddy forwards Nginx's trusted IP. The fixture processes and
  listeners were removed. The revised SaaS and runtime archives passed
  checksum and packaged smoke tests on Linux/Node 24 before installation.
- The operator confirmed Cloudflare's zone SSL mode is `Full`. It was left
  unchanged because the apex `rai2.si` still uses a separate Cloudflare
  Tunnel, and changing the zone-wide mode may affect it.
- The candidate Nginx vhost was checked with an isolated `nginx -t` config
  and left in `sites-available`; the hold vhost remains the only enabled RAI2
  vhost. Latest read-only checks returned public `app.rai2.si` 503,
  `rai2.si` 200 and `raifirst.si` 200, all with valid TLS. Nginx, Caddy,
  SaaS, fleet agent and fence services were active.
- SePay's official webhook guide at
  `https://docs.sepay.vn/tich-hop-webhooks.html` confirms the handler's JSON
  fields (`id`, `accountNumber`, `transferType`, `transferAmount`), API-Key
  authorization scheme and success envelope. No real payment notification
  was sent; the provider configuration and bank receipt remain unverified.

## Private Preview (2026-11-12, Asia/Saigon)

- The SaaS control plane was rebuilt as archive
  `rai2-saas-0.1.151-4e43f3e3ce4f4d01.tgz`, SHA-256
  `4e43f3e3ce4f4d01f10ba371d3a159703e528a640688e1fe16deab122fcd28b9`.
  It passed checksum and packaged smoke on Windows and Linux/Node 24.
- Six isolated SaaS tests passed. The new preview test proves only the
  allowlisted email receives OTP, while order creation, QR and webhook
  endpoints refuse requests. Chrome checked the preview at 1440x900 and
  390x844 with the payment button hidden; screenshots are under
  `.omb-scratch/saas-ui-preview-final/`.
- The Resend sender domain was reported `verified` by Resend's read-only API.
  SMTP authentication also passed without sending mail. This does not prove
  delivery to an inbox.
- The versioned SaaS bundle and a systemd override were deployed with
  `RAI2_SAAS_PAYMENTS_ENABLED=0` and one private preview email. Internal
  `/api/status` returned `{"paymentsEnabled":false,"privatePreview":true}`.
  Nginx switched from the hold vhost to the reviewed proxy after `nginx -t`.
  Public GET checks returned 200 for `/`, `/app.js`, `/app.css` and `/healthz`
  with valid TLS. Public `/api/status` confirmed the same preview state.
- The separate apex `rai2.si` returned Cloudflare 530 / error 1033 during
  this check. Its DNS still points at a Cloudflare Tunnel, while the local
  Windows machine showed no `cloudflared` process or listener on port 8799.
  `raifirst.si` remained 200. The apex outage is unresolved and is separate
  from the new VPS-hosted `app.rai2.si`.

## Apex routing and launch gates (2026-11-12, Asia/Saigon)

- A Let's Encrypt certificate for the apex `rai2.si` was issued by DNS
  challenge. A new Nginx vhost returned 302 to `https://app.rai2.si/` with
  the path and query string preserved and a valid origin certificate. The
  prior Cloudflare CNAME record ID and tunnel target were recorded before its
  exact record was updated to a proxied A record for `167.86.106.149`.
  Public `rai2.si` now redirects to `app.rai2.si`, which returns 200;
  `raifirst.si` still returns 200. The old Windows bot data was not removed.
- An encrypted `age` backup covered a consistent SQLite snapshot, fleet
  registry, SaaS environment, Nginx and TLS configuration. Its SHA-256 matched
  after transfer to the operator workstation. A test restore extracted only
  SQLite, registry and environment into a local scratch directory; SQLite
  `PRAGMA quick_check` returned `ok`. A policy blocked automatic deletion of
  the plaintext scratch archive and folder; the operator must delete those
  two exact scratch items manually while keeping the `.age` file.
- A daily encrypted backup timer was installed and a manual systemd run
  completed successfully. The next run was scheduled for 2026-11-13 around
  02:39 CET. No automated retention or offsite transfer is configured.
- A disposable Linux container ran two real packaged tenant servers under
  separate Unix users. Each could reach its own API but could not reach the
  sibling API or home, or the internal edge/control-plane ports 8081/8812.
  No test tenant or nftables rule was created on the live host.
- The photographed SePay webhook was active and set to incoming transfers,
  but used HMAC-SHA256 and applied to all bank accounts. The original handler
  expected API Key authentication. The revised handler verifies SePay HMAC
  over the raw body with a five-minute timestamp window before parsing JSON;
  isolated tests covered altered bodies, stale timestamps, invalid signatures
  and duplicate events. The bank-account scope must be narrowed in SePay.
- The SaaS shared-host cap reserves two workspace slots before accepting
  payment orders, sets each tenant's systemd memory limit to 2 GB, and expires
  unpaid order codes after 24 hours. Late transfers enter manual
  reconciliation. The revised SaaS archive was installed while payment stayed
  disabled; public `/LICENSE` and `/NOTICE` returned 200.
- At this pre-activation stage, the SePay HMAC secret was still a placeholder
  in the operator's local file, and `/api/status` remained
  `{"paymentsEnabled":false,"privatePreview":true}`. Do not enable payment
  or remove the private-preview allowlist until the secret, webhook scope,
  real delivery and first paid workspace flow are verified.

## Production activation (2026-11-12, Asia/Saigon)

- The SePay HMAC secret was supplied through the Git-ignored local file and
  installed in the root-owned service environment without printing its value.
  The original OTP pepper and tenant signing key were retained. The operator
  showed an active HMAC webhook for incoming TPBank transfers scoped to the
  account ending `0675`, which matched the configured account suffix, and
  restored its URL to `app.rai2.si` after the provider test.
- An isolated `webhook-test.rai2.si` fixture used the actual HMAC handler and
  a disposable database. A synthetic signed request returned HTTP 200 with
  `accepted:false`; SePay's own **Gửi thử** reported HTTP 200 in 975 ms. The
  fixture service and its Nginx vhost were then stopped/disabled. Unknown
  wildcard hosts now return 404 from Caddy instead of an empty 200.
- A containerized Linux check ran two real packaged tenants as separate Unix
  users. Each reached only its own API; sibling homes/APIs and internal ports
  8081/8812 were denied. It also verified the runtime serves its Apache
  license. OpenAI-compatible BYOK driver fixtures passed 111 tests after
  updating three stale expected product-name strings. OpenCode OSS v2.2.5
  was installed with the repository-pinned archive and binary SHA-256 values;
  its first-run model catalog returned an upstream 500, so the direct
  OpenAI-compatible driver is the verified BYOK path.
- The runtime archive at production activation was
  `rai2-runtime-0.1.151-acf43d57ddf556ed.tgz` (SHA-256
  `acf43d57ddf556ed866019a4db1b90f065795515ccb7ab936f22910c63385892`).
  The SaaS archive at production activation was `rai2-saas-0.1.151-13553c7e7affa72a.tgz`
  (SHA-256 `13553c7e7affa72a215ee9a9becb48bc23e4bc0fc3e0bedc0719965d7d1ca01d`).
  Both passed local and Linux/Node 24 packaged smoke with matching checksums.
  Eight SaaS tests passed, covering HMAC tampering/replay, two-slot capacity,
  24-hour order expiration and late-payment reconciliation. Public license
  and notice routes returned 200.
- Cloudflare was changed by the operator to Full (strict). Read-only HTTPS
  checks returned apex 302 to `https://app.rai2.si/`, app 200, wildcard
  fixture 200 before teardown, and `raifirst.si` 200, with TLS verification
  success and no 526 response.
- The service override now has `RAI2_SAAS_PAYMENTS_ENABLED=1` and an empty
  preview email. Public `/api/status` returned
  `{"paymentsEnabled":true,"privatePreview":false}`. Public `/`, JS, CSS,
  `/LICENSE` and `/NOTICE` returned 200; unauthenticated `/api/me` returned
  401. Chrome CDP verified the live sign-in page at 1440x900 and a true
  390x844 viewport without horizontal overflow; screenshots are in
  `.omb-scratch/public-ui-production/`.
- The post-launch encrypted backup was copied to
  `.omb-scratch/rai2-backups/2026-11-12T043516Z.tar.gz.age`; local and VPS
  SHA-256 both equaled
  `21d669cafaea7b06715478bfef8d7f0e7265d4675dde11dc73cd8fe0fea8f382`.
  The backup timer and the Nginx, Caddy, SaaS, fleet and fence services were
  active. The production SQLite `PRAGMA quick_check` returned `ok`; at the
  launch check it held zero accounts, orders, payments and unmatched receipts.
- No real bank transfer was made for acceptance. The operator chose to watch
  the first genuine payment instead. A read-only hourly Codex follow-up was
  created to alert on the first payment, provisioning failure or service
  error, and pause after a healthy first workspace. This does not yet prove
  delivery of an OTP email to a real inbox or an actual paid workspace. The
  operator deferred the live OTP sign-in test until later.

## Landing restoration (2026-11-12, Asia/Saigon)

- The original RAI² landing and registration design was inspected from Git
  history. Its old guest, instant-access and multi-tier checkout handlers
  depended on removed unsafe routes and unimplemented plans. The current
  landing keeps the dark RAI² visual language, logo and custom mascot assets,
  but offers only the implemented BYOK 299,000 VND monthly plan.
- The versioned SaaS archive now contains `landing.html`, `landing.css`,
  RAI² logos and eight mascot images. `rai2.si` serves this static landing
  from the root-owned bundle; CTAs go to `app.rai2.si` for OTP and payment.
  The account UI uses the same dark palette and retains its existing backend.
- The first landing archive was `rai2-saas-0.1.151-884fc866e8130102.tgz`,
  SHA-256 `884fc866e8130102b006534383a5bb85dc1be61d34b84c97f2760a9d19004502`.
  Its checksum and packaged smoke passed locally and in an isolated Linux
  Node 24 container. The previous bundle remains at its versioned release
  path for rollback.
- Chrome CDP checked live `rai2.si` and `app.rai2.si` at 1440x900,
  390x844 and 320x720. All mascot images loaded, mobile navigation opened,
  the next section appeared in the first mobile viewport, landing CTA
  targeted the account portal, and neither page overflowed horizontally.
  Screenshots are in `.omb-scratch/landing-production-final/` and
  `.omb-scratch/account-production-final/`.

## Original layout restored (2026-11-12, Asia/Saigon)

- The first static landing was rejected by the operator as a different
  design. The original `RaiLandingPage.tsx` at HEAD was inspected again.
  The replacement now follows its centered question headline with an inline
  character badge, two CTAs, four-metric row, eight-mascot team, philosophy,
  feature and pricing sections, light/dark toggle and mobile navigation.
  The account sign-in now uses the original centered dark dialog treatment
  while retaining the verified OTP, session and payment APIs.
- The original component's instant-access and guest routes, and three
  unimplemented paid tiers were not restored at that stage. Every
  registration CTA goes to the real account portal with the sole BYOK plan.
- The layout archive at that stage was
  `rai2-saas-0.1.151-7c5b181051a30fdf.tgz` (SHA-256
  `7c5b181051a30fdf5e4678cb0fd10b9421bb1ff2cd83cbc39401c98e16bba42d`).
  Local and isolated Linux package smoke passed, and public screenshots
  in `.omb-scratch/original-landing-production/` and
  `.omb-scratch/original-account-production-logo-check/` verified the
  original layout at desktop and mobile sizes.

## 14-day trial implementation (2026-11-12, Asia/Saigon)

- Verified email OTP starts a 14-day trial once per account and reserves a
  workspace slot in one SQLite transaction. The trial end time persists through
  sign-out, sign-in and restart. An already paid account does not get a new
  trial. Trial expiry suspends the workspace without deleting its home; a
  payment made during the trial starts its paid month after the trial ends.
- The shared VPS has a capacity of two simultaneous workspace slots. When
  both slots are held, a new email's verified OTP receives HTTP 409 without
  creating a new account or payment order. Expired trials are suspended and
  do not reserve a new-trial slot; their Unix account and home remain
  retained until an explicit operator decision. The public status endpoint
  reports availability for the UI; the transactional check is authoritative.
- Isolated API tests cover distinct slugs for two emails, a third email
  refused at capacity, tenant OTP during trial, expiry and suspension, no
  repeated trial, early payment, and migration of an existing SQLite schema.
- A disposable Ubuntu 24.04 container with systemd, nftables, Caddy and the
  reviewed runtime archive drove the real fleet agent by Unix socket.
  Two synthetic emails completed HTTP OTP -> trial -> fleet create and
  received distinct, running workspace URLs. Each Unix user reached only its
  own API/home; the other workspace and internal ports were denied. A third
  verified email was refused at capacity. Suspend and resume succeeded.
  The container was removed; the production fleet registry remained empty.
- The landing now shows the free 14-day plan before the 299,000 VND monthly
  plan. The account UI shows trial end, provisioning state and the workspace
  link without payment. A shared-domain theme cookie carries light/dark
  preference from `rai2.si` to `app.rai2.si`.
- Production now runs `rai2-saas-0.1.151-c9103d1bfc23aaac.tgz`, SHA-256
  `c9103d1bfc23aaac0615cde9073a5029ee747413a8dcba4e9dce036d0840e95b`.
  The archive passed local and isolated Linux Node 24 smoke. The service
  returned `{"paymentsEnabled":true,"privatePreview":false,"trialDays":14,
  "trialAvailable":true}`; SQLite `PRAGMA quick_check` returned `ok`,
  and existing account/order/payment counts remained zero after migration.
  The previous versioned archive remains available for rollback.
- Chrome CDP verified public landing and account pages at 1440x900, 390x844
  and 320x720. It checked the 14-day CTA, mobile layout, and a shared-domain
  light/dark preference across `rai2.si` and `app.rai2.si`; screenshots
  are under `.omb-scratch/trial-production-landing-final/` and
  `.omb-scratch/trial-production-account-final/`. Fixture UI screenshots
  under `.omb-scratch/trial-ui-qa-final/` show the active trial, workspace
  URL and date with no payment button.
- An encrypted post-migration backup was copied to
  `.omb-scratch/rai2-backups/2026-11-12T093415Z.tar.gz.age`; local and VPS
  SHA-256 both equaled
  `b2086ecfb34bd00e9f33b3dbbeba4737042a7a24d82689d79ff5b29b3494a68e`.
  Real inbox delivery and a customer signup on production remain untested;
  no live account was created for verification.

## Account-to-workspace handoff (2026-11-12, Asia/Saigon)

- The portal now creates a 60-second, one-use handoff tied to the authenticated
  account session and its active workspace. The browser carries the code in a
  URL fragment, removes it from history before a same-origin POST, and the
  workspace consumes it through the existing tenant-authenticated backchannel.
  A workspace-local, host-only, HttpOnly session is issued only after its own
  allow-list confirms the owner. Portal and workspace cookies remain separate.
- An unsigned-in direct workspace visit returns to `app.rai2.si/?open=1`.
  After portal OTP, the same account automatically opens its workspace without
  a second email OTP. Local workspace OTP remains as a recovery route.
- Isolated API fixtures passed 13 tests: one-use exchange, wrong workspace,
  wrong tenant credential, logout and expiry refusal, CSRF refusal, allow-list
  refusal, and scoped workspace cookie. The existing portal UI fixture passed
  at desktop and mobile sizes with the new open-workspace link.
- A disposable systemd container on the VPS passed real fleet provisioning of
  two distinct workspaces, Unix user and loopback isolation, unsigned-in
  redirect, claim page, suspend and resume. The container was removed.
- The release kept the exact production runtime UI bytes (its `dist/index.html`
  SHA-256 remained `c0e88a2c6456fef6efcd811858f298a2a2e8e24677d7d668a843d66e60bdffd3`).
  The OSS runtime archive `rai2-runtime-0.1.151-dc7bd139522ba054.tgz`
  has SHA-256 `dc7bd139522ba054790dec04b1aaa1a94d5f725739973691224498a527c4209b`.
  The SaaS archive `rai2-saas-0.1.151-6f3bd3efb76ed6e2.tgz` has SHA-256
  `6f3bd3efb76ed6e287d1f0f1342a17e750e0bb1335c2c1aeddba5edce9029d1b`.
  Both archive checksums matched on the VPS before installation.
- Before deployment an encrypted backup was copied locally and matched VPS
  SHA-256 `e8fdc088e47811b57cb0e467a9dbedcd57997b9a455e6c927114ff893452a059`.
  After deployment the portal, fleet, Nginx and Caddy were active; SQLite
  `PRAGMA quick_check` was `ok`, one existing workspace remained active, and
  the public claim page and script returned HTTP 200. No production login or
  customer data was mutated for acceptance. A real browser handoff with a
  customer session remains unobserved.
- The encrypted post-upgrade backup was copied locally and matched VPS SHA-256
  `2417eaed414379fe112ae4dcd53c733e6fc54bef4cc9a66a177715278adb6bb1`.
- The runtime source's obsolete guest button was routed to the real 14-day
  portal rather than a removed guest API, and the public UI verification
  script's cleanup was made lint-safe. Full `pnpm typecheck` and `pnpm lint`
  then passed, along with scoped SaaS checks, 13 API fixtures, UI fixtures,
  packaged smoke and the isolated Linux fleet.
- A broader five-suite authentication regression run passed 73 tests; its
  email-signin and hosted-access full-server fixtures hit their existing
  20-second Windows startup deadlines before logging a server error (26 tests
  skipped). The email-signin suite also timed out when run alone. This is not
  evidence that those two fixture suites passed; the packaged runtime and
  systemd fixture above provide independent server verification.

## Mobile landing and favicon (2026-11-12, Asia/Saigon)

- The RAI² wordmark is 74px in desktop/tablet headers and 66px in mobile
  headers. The account header uses the same dimensions. The mobile landing
  hero, metrics, team grid, pricing and footer were adjusted at 320-390px.
  The first viewport reveals the team section at 320px.
- The mobile navigation uses a modal dialog with large link targets, a visible
  close button, Escape and backdrop dismissal, scroll locking, accessible
  expanded state, and reduced-motion handling. Section links clear the modal
  and land below the sticky header.
- The favicon is a square R² mark built as SVG, 32px PNG, multi-size
  ICO (16/32/48px), and 180px touch icon. The initial static release served
  it on the apex; the final release serves the same icons on the account host.
- An isolated Chrome fixture checked 320, 360, 390, 768, 1024 and 1440px for
  image loading, horizontal overflow, card clipping, header separation,
  mobile menu size, backdrop/Escape/section-link dismissal, and anchor offset.
  Screenshots are under `.omb-scratch/rai2-mobile-refresh-final/`.
- The static archive `rai2-saas-0.1.151-ea33c380c2f5836e.tgz` passed
  checksum and packaged smoke. SHA-256 was
  `ea33c380c2f5836e641d6f034c20f31dad9a145ddcd6e9ed963f5c9f7f9e782a`.
  Its `main.mjs`, `init.mjs`, `reconcile.mjs`, account HTML and account JS
  matched the prior production release byte-for-byte before activation.
- A pre-deployment encrypted backup was copied locally; its SHA-256 matched
  the VPS at `2cd6972f25d992be1c76b7d7d57a6dcd9d2a30dca0f61fa96ab942de315052bf`.
  Nginx config validation, origin HTTPS landing/favicon probes and SaaS
  health passed after activation. Public Chrome checked 1440x900, 390x844
  and 320x720, including mobile navigation and light/dark handoff; screenshots
  are in `.omb-scratch/rai2-mobile-production-final/`. Account screenshots at
  those sizes are in `.omb-scratch/rai2-account-logo-production/`.
  Nginx, Caddy, SaaS and fleet services were active, SQLite quick_check was
  `ok`, and the existing workspace count was unchanged after release.

## Workspace capacity expansion (2026-11-12, Asia/Saigon)

- Production had reached its configured two-workspace limit. Both reservations
  and both fleet services were active, while the public status endpoint returned
  `trialAvailable:false`. The 8 GB shared VPS reported 4.8 GB available RAM;
  the two tenant services used about 220 MB each and had recorded peaks of
  0.85 GB and 1.07 GB under their existing 2 GB per-tenant limits.
- The shared-host limit and the source defaults were raised from two to four.
  This leaves room for two more trial or paid workspaces without claiming that
  a single shared host has unlimited capacity. Raising the limit further
  requires more memory or another fleet host.
- Before the production change, `saas:check`, all 12 isolated SaaS tests and
  the packaged SaaS smoke passed. The development host used Node 22 and emitted
  the repository's Node 24 engine warning; production continues to run Node 24.
- `/etc/rai2/saas.env` was copied to the root-owned
  `/etc/rai2/saas.env.before-capacity-4-20261112` before changing only
  `RAI2_MAX_WORKSPACES`. Restoring that file and restarting `rai2-saas.service`
  is the rollback.
- After restart, the SaaS service was active, SQLite `PRAGMA quick_check`
  returned `ok`, both existing fleet services remained active, and the internal
  and public status endpoints returned `trialDays:14` and
  `trialAvailable:true`. No production account or workspace was created for
  verification.
- Headless Chrome loaded the public portal, ran its status request and kept the
  `trial-full` notice hidden. The broader public UI script stopped at its
  unrelated language-selector assertion because the deployed markup shows the
  selector while the local fixture expects it hidden; no full layout-suite pass
  is claimed for this change.

## Unified favicon release (2026-11-12, Asia/Saigon)

- The final static archive is `rai2-saas-0.1.151-56b0d744324c2b37.tgz`,
  SHA-256 `56b0d744324c2b37a8ade2717a8dca3ed2944cb85244cc9a7979643f80e37057`.
  It passed packaged smoke and VPS checksum validation. The server bundles
  `main.mjs`, `init.mjs`, `reconcile.mjs` and account `app.js` matched the
  previous release byte-for-byte. The landing HTML/CSS/JS also matched the
  first responsive release byte-for-byte after final activation.
- Nginx now serves only the four RAI² icon paths from the versioned SaaS
  public directory on the account and workspace host block. The account HTML
  references the same SVG, PNG, ICO and touch icon as the apex. Nginx config
  validation, app health, and origin HTTPS icon probes passed; public SVG and
  ICO returned HTTP 200 with correct content types on both hosts.
- The encrypted pre-change backup was copied locally and matched VPS SHA-256
  `43a353a2e9eb55bcf82f7f0e4e9b30a61747bd9e00dfd9c2830e1cec722bed99`.
  A failed first rollout rolled back the symlink and Nginx config; the cause
  was the running SaaS process retaining its old versioned HTML path. The
  final rollout restarted SaaS, waited for health, and passed all icon probes.
- After deployment, Nginx, Caddy, SaaS and fleet services were active;
  SQLite `PRAGMA quick_check` was `ok` and the two workspace reservations were
  unchanged. Headless Chrome verified account layout at 1440x900, 390x844,
  and 320x720 in `.omb-scratch/rai2-account-logo-production/`. The landing
  passed a public Chrome check at those sizes before the final icon-only
  update, and its files remained byte-identical afterward.

## Visible logo refresh and cache bust (2026-11-12, Asia/Saigon)

- Public Cloudflare responses initially contained the prior responsive release,
  but `landing.css` advertised a four-hour browser cache. The first reduction
  from 86px to 74/66px was also visually subtle. The live landing now uses a
  versioned CSS URL with a 60px desktop and 54px mobile wordmark. The account
  portal uses `app.css?v=20261112-logo2` with 60px desktop, 54px mobile and
  50px compact breakpoints.
- The final account candidate was built from the then-current production
  release, preserving `main.mjs`, `init.mjs`, `reconcile.mjs`, account JS and
  all landing files byte-for-byte. Its archive is
  `rai2-saas-0.1.151-fdcd016740fb3dae.tgz`, SHA-256
  `fdcd016740fb3dae59a03e82828e82db30dbaf2157a62ac2a49d34c0a6292f46`.
- The encrypted pre-deployment backup was copied locally and matched the VPS
  at SHA-256 `04fb42dca36c91587d7af94a6daff26f2bf91b797a8e40ed2c0570bf0066bd61`.
  A later backup of the concurrent production release also matched at
  `15cd539ec11f0da195cae26d3cc013e1c99bcf4985888123fee2ef709793b208`.
- Cloudflare returned the expected versioned CSS URLs and exact 60/54/50px
  rules. Public Chrome passed the landing responsive/menu/favicons fixture and
  the account layout at 1440x900, 390x844 and 320x720. Evidence is under
  `.omb-scratch/rai2-visible-live-final/` and
  `.omb-scratch/rai2-account-visible-final-2/`.
- After activation, SaaS, fleet, Nginx and Caddy were active, SQLite
  `PRAGMA quick_check` was `ok`, three workspace reservations remained active,
  and the paid-order count remained zero. No customer record was mutated for
  visual verification.

## Account workspace-address UX (2026-11-12, Asia/Saigon)

- The account portal now shows the active workspace address before exposing an
  on-demand editor. The editor normalizes Vietnamese input, joins the hostname
  suffix to the field, disables unchanged or invalid saves, reports busy,
  success and error states, restores focus after Save or Cancel, and rejects
  missing or legacy `undefined` handle values in the renderer.
- The isolated SaaS API suite passed 12 tests; SaaS type-check and scoped lint
  passed. The authenticated Chrome fixture exercised Save and Cancel at
  1440x900, 390x844 and 320x720 with no horizontal overflow. Screenshots are
  under `.omb-scratch/workspace-handle-ui-final/`.
- A first candidate correctly refused activation when another release changed
  the production symlink after staging. The workspace UX was rebased onto each
  new production base instead of overwriting concurrent logo and font work.
  File manifests proved every file outside the intended account assets remained
  byte-identical to its base before activation.
- The final cache-busting candidate was based on
  `/opt/rai2/releases/saas-8f006c551548c8a2/saas` and changed only the account
  HTML references to versioned workspace-UX CSS and JS URLs. The active archive
  is `rai2-saas-0.1.151-3b1bc787798ef764.tgz`, SHA-256
  `3b1bc787798ef764473dffa2eb8b1e827c72e901cd47d6c454cd4c6192079214`.
  It passed the full packaged SaaS checksum, inventory and runtime smoke.
- The encrypted backup immediately before activation was copied locally and
  matched the VPS at SHA-256
  `3ded503e5e5dd41e3fcbf378f6f8c0b88a215c4e3e897c2fc525107cc9a8564f`.
  Restoring the previous symlink to
  `/opt/rai2/releases/saas-8f006c551548c8a2/saas` and restarting `rai2-saas`
  is the application rollback.
- The public HTML referenced `app.css?v=20261112-workspace-ux` and
  `app.js?v=20261112-workspace-ux`; both assets matched the candidate
  byte-for-byte. Cloudflare added only its analytics beacon to the account HTML.
  Public Chrome passed the account page at 1440x900, 390x844 and 320x720;
  evidence is under
  `.omb-scratch/account-workspace-ux-public-production-final-3b1bc787798ef764/`.
  SaaS, fleet, Nginx and Caddy were active, SQLite `PRAGMA quick_check` was
  `ok`, and four live trials remained active. No production login or account
  mutation was used for release verification.

## Friendly workspace hosts (2026-11-12, Asia/Saigon)

- Workspace owners can set a 3–30 character friendly address such as
  `an-phat.rai2.si` from the account portal. The opaque `u-…` slug remains the
  tenant identity for its Unix account, data directory, registry entry and
  signing token. Earlier addresses stay reserved and redirect to the current
  address; changes are limited to once per hour.
- The isolated SaaS suite passed 13 tests and the focused fleet/handoff suite
  passed 22 tests with 8 Linux-only tests skipped on Windows. SaaS and server
  typechecks, scoped lint, package smoke, checksum verification, authenticated
  Chrome at 1440x900 and 390x844, and the Linux artifact probes passed.
- Deployment repeatedly refused to activate while a concurrent landing release
  changed the production symlink. The final candidate was rebased onto
  `/opt/rai2/releases/saas-7093885f0a06d55d/saas`; its landing, account JS/CSS
  and assets matched that base byte-for-byte before activation.
- The runtime archive is `rai2-runtime-0.1.151-2566e5aed899da9e.tgz`, SHA-256
  `2566e5aed899da9e4b1a4fda357cd7495a4a4cce240a80efa25ffa4bab957622`.
  The active control-plane archive is
  `rai2-saas-0.1.151-b55155eab50dec1b.tgz`, SHA-256
  `b55155eab50dec1b16f47bd6b21fb5718244ba354785a493138137866248977a`.
- Before activation, the encrypted backup was copied locally and matched the
  VPS at SHA-256
  `f03e1436401ac27b7f36f159eb61d1d490128330c2160339deb4fd29c43b14e3`.
  The deployment also packed the previously installed runtime and copied all
  four tenant environment files for immediate rollback.
- After activation, SaaS, fleet, Nginx and Caddy were active. SQLite
  `PRAGMA quick_check` returned `ok`, both new account columns and the alias
  table existed, and no account had been assigned a friendly handle. All four
  existing opaque tenant hosts returned 200 for health and sign-in claim.
  Public account JS/CSS matched the candidate byte-for-byte and unauthenticated
  handle mutation was denied. No customer account or workspace was mutated for
  production verification.
