import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export const MONTHLY_PRICE_VND = 299_000;
export const ORDER_TTL_MS = 24 * 60 * 60_000;
export const TRIAL_MS = 14 * 86_400_000;
export const WORKSPACE_HANDLE_COOLDOWN_MS = 60 * 60_000;

export class WorkspaceCapacityError extends Error {}
export class WorkspaceHandleTakenError extends Error {}
export class WorkspaceHandleCooldownError extends Error {}

export type WorkspaceState = "none" | "active" | "suspended" | "error";

export interface Account {
  id: string;
  email: string;
  slug: string;
  workspaceHandle: string | null;
  paidThrough: number;
  trialThrough: number;
  workspaceState: WorkspaceState;
}

export interface Order {
  id: string;
  accountId: string;
  code: string;
  amount: number;
  status: "pending" | "paid";
  createdAt: number;
  paidAt: number | null;
}

type AccountRow = {
  id: string; email: string; slug: string; paid_through: number; trial_started_at: number | null;
  trial_expires_at: number | null; billing_anchor_day: number | null; workspace_state: WorkspaceState;
  workspace_handle: string | null; workspace_handle_changed_at: number;
};
type OrderRow = {
  id: string; account_id: string; code: string; amount: number; status: "pending" | "paid";
  created_at: number; paid_at: number | null;
};
type ChallengeRow = { code_hash: string; expires_at: number; attempts: number; sent_at: number };

const accountOf = (row: AccountRow): Account => ({
  id: row.id, email: row.email, slug: row.slug, paidThrough: row.paid_through,
  workspaceHandle: row.workspace_handle, trialThrough: row.trial_expires_at ?? 0,
  workspaceState: row.workspace_state,
});
const orderOf = (row: OrderRow): Order => ({
  id: row.id, accountId: row.account_id, code: row.code, amount: row.amount,
  status: row.status, createdAt: row.created_at, paidAt: row.paid_at,
});

export function nextMonthlyDate(from: number, anchorDay = new Date(from).getUTCDate()): number {
  const at = new Date(from);
  const target = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + 1, 1,
    at.getUTCHours(), at.getUTCMinutes(), at.getUTCSeconds(), at.getUTCMilliseconds()));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(anchorDay, last));
  return target.getTime();
}

const RESERVED_WORKSPACE_HANDLES = new Set([
  "admin", "api", "app", "assets", "billing", "help", "login", "mail", "register",
  "signin", "signup", "static", "status", "support", "webhook", "www",
]);

export function normalizeWorkspaceHandle(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const handle = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 30).replace(/-+$/g, "");
  return handle.length >= 3 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])$/.test(handle) &&
    !handle.startsWith("u-") && !RESERVED_WORKSPACE_HANDLES.has(handle) ? handle : null;
}

export class SaasStore {
  readonly #db: DatabaseSync;

  constructor(file: string) {
    mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
    this.#db = new DatabaseSync(file);
    this.#db.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000");
    this.#db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE,
        paid_through INTEGER NOT NULL DEFAULT 0,
        trial_started_at INTEGER,
        trial_expires_at INTEGER,
        billing_anchor_day INTEGER,
        workspace_handle TEXT,
        workspace_handle_changed_at INTEGER NOT NULL DEFAULT 0,
        workspace_state TEXT NOT NULL DEFAULT 'none'
          CHECK (workspace_state IN ('none', 'active', 'suspended', 'error')),
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS challenges (
        identity TEXT PRIMARY KEY, code_hash TEXT NOT NULL, expires_at INTEGER NOT NULL,
        attempts INTEGER NOT NULL, sent_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS start_limits (
        source_hash TEXT NOT NULL, bucket INTEGER NOT NULL, count INTEGER NOT NULL,
        PRIMARY KEY (source_hash, bucket)
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id),
        expires_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS workspace_handoffs (
        code_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id),
        session_hash TEXT NOT NULL REFERENCES sessions(token_hash) ON DELETE CASCADE,
        expires_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS workspace_handle_aliases (
        handle TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id), created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id),
        code TEXT NOT NULL UNIQUE, amount INTEGER NOT NULL, status TEXT NOT NULL
          CHECK (status IN ('pending', 'paid')),
        created_at INTEGER NOT NULL, paid_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS payments (
        reference TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id),
        amount INTEGER NOT NULL, received_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS unmatched_payments (
        reference TEXT PRIMARY KEY, code TEXT, amount INTEGER NOT NULL,
        reason TEXT NOT NULL, received_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS manual_reconciliations (
        reference TEXT PRIMARY KEY REFERENCES payments(reference),
        order_id TEXT NOT NULL REFERENCES orders(id), applied_at INTEGER NOT NULL
      );
    `);
    const columns = this.#db.prepare("PRAGMA table_info(accounts)").all() as Array<{ name: string }>;
    if (!columns.some((column) => column.name === "billing_anchor_day")) {
      this.#db.exec("ALTER TABLE accounts ADD COLUMN billing_anchor_day INTEGER");
    }
    if (!columns.some((column) => column.name === "trial_started_at")) {
      this.#db.exec("ALTER TABLE accounts ADD COLUMN trial_started_at INTEGER");
    }
    if (!columns.some((column) => column.name === "trial_expires_at")) {
      this.#db.exec("ALTER TABLE accounts ADD COLUMN trial_expires_at INTEGER");
    }
    if (!columns.some((column) => column.name === "workspace_handle")) {
      this.#db.exec("ALTER TABLE accounts ADD COLUMN workspace_handle TEXT");
    }
    if (!columns.some((column) => column.name === "workspace_handle_changed_at")) {
      this.#db.exec("ALTER TABLE accounts ADD COLUMN workspace_handle_changed_at INTEGER NOT NULL DEFAULT 0");
    }
    this.#db.exec("CREATE UNIQUE INDEX IF NOT EXISTS accounts_workspace_handle ON accounts(workspace_handle) WHERE workspace_handle IS NOT NULL");
  }

  close(): void { this.#db.close(); }

  beginChallenge(identity: string, sourceHash: string, codeHash: string, now: number): boolean {
    this.#db.exec("BEGIN IMMEDIATE");
    try {
      const bucket = Math.floor(now / 600_000);
      this.#db.prepare("DELETE FROM start_limits WHERE bucket < ?").run(bucket - 1);
      this.#db.prepare(`INSERT INTO start_limits (source_hash, bucket, count) VALUES (?, ?, 1)
        ON CONFLICT (source_hash, bucket) DO UPDATE SET count = count + 1`).run(sourceHash, bucket);
      const limit = this.#db.prepare("SELECT count FROM start_limits WHERE source_hash = ? AND bucket = ?")
        .get(sourceHash, bucket) as { count: number };
      const earlier = this.#db.prepare("SELECT sent_at FROM challenges WHERE identity = ?").get(identity) as { sent_at: number } | undefined;
      if (limit.count > 10 || (earlier && now - earlier.sent_at < 30_000)) {
        this.#db.exec("COMMIT");
        return false;
      }
      this.#db.prepare(`INSERT INTO challenges (identity, code_hash, expires_at, attempts, sent_at)
        VALUES (?, ?, ?, 0, ?) ON CONFLICT(identity) DO UPDATE SET
        code_hash = excluded.code_hash, expires_at = excluded.expires_at,
        attempts = 0, sent_at = excluded.sent_at`).run(identity, codeHash, now + 600_000, now);
      this.#db.exec("COMMIT");
      return true;
    } catch (error) {
      this.#db.exec("ROLLBACK");
      throw error;
    }
  }

  discardChallenge(identity: string, codeHash: string): void {
    this.#db.prepare("DELETE FROM challenges WHERE identity = ? AND code_hash = ?").run(identity, codeHash);
  }

  consumeChallenge(identity: string, codeHash: string, now: number): boolean {
    this.#db.exec("BEGIN IMMEDIATE");
    try {
      const row = this.#db.prepare("SELECT code_hash, expires_at, attempts, sent_at FROM challenges WHERE identity = ?")
        .get(identity) as ChallengeRow | undefined;
      if (!row || row.expires_at <= now || row.attempts >= 5) {
        this.#db.prepare("DELETE FROM challenges WHERE identity = ?").run(identity);
        this.#db.exec("COMMIT");
        return false;
      }
      const expected = Buffer.from(row.code_hash, "hex");
      const actual = Buffer.from(codeHash, "hex");
      const matched = expected.length === actual.length && timingSafeEqual(expected, actual);
      if (matched) this.#db.prepare("DELETE FROM challenges WHERE identity = ?").run(identity);
      else this.#db.prepare("UPDATE challenges SET attempts = attempts + 1 WHERE identity = ?").run(identity);
      this.#db.exec("COMMIT");
      return matched;
    } catch (error) {
      this.#db.exec("ROLLBACK");
      throw error;
    }
  }

  createSession(email: string, tokenHash: string, now: number, trial?: { maxWorkspaces: number }): Account {
    const normalized = email.trim().toLowerCase();
    this.#db.exec("BEGIN IMMEDIATE");
    try {
      let row = this.#db.prepare("SELECT * FROM accounts WHERE email = ?").get(normalized) as AccountRow | undefined;
      if (!row) {
        const id = randomUUID();
        const slug = `u-${id.replaceAll("-", "").slice(0, 20)}`;
        this.#db.prepare("INSERT INTO accounts (id, email, slug, created_at) VALUES (?, ?, ?, ?)")
          .run(id, normalized, slug, now);
        row = this.#db.prepare("SELECT * FROM accounts WHERE id = ?").get(id) as AccountRow;
      }
      if (trial && row.trial_started_at === null && row.paid_through === 0) {
        if (this.#occupiedWorkspaces(row.id, now) >= trial.maxWorkspaces) {
          throw new WorkspaceCapacityError("workspace capacity reached");
        }
        this.#db.prepare("UPDATE accounts SET trial_started_at = ?, trial_expires_at = ? WHERE id = ?")
          .run(now, now + TRIAL_MS, row.id);
        row = this.#db.prepare("SELECT * FROM accounts WHERE id = ?").get(row.id) as AccountRow;
      }
      this.#db.prepare("INSERT INTO sessions (token_hash, account_id, expires_at) VALUES (?, ?, ?)")
        .run(tokenHash, row.id, now + 30 * 86_400_000);
      this.#db.exec("COMMIT");
      return accountOf(row);
    } catch (error) {
      this.#db.exec("ROLLBACK");
      throw error;
    }
  }

  accountForSession(tokenHash: string, now: number): Account | null {
    const row = this.#db.prepare(`SELECT a.* FROM accounts a JOIN sessions s ON s.account_id = a.id
      WHERE s.token_hash = ? AND s.expires_at > ?`).get(tokenHash, now) as AccountRow | undefined;
    return row ? accountOf(row) : null;
  }

  accountForSlug(slug: string): Account | null {
    const row = this.#db.prepare("SELECT * FROM accounts WHERE slug = ?").get(slug) as AccountRow | undefined;
    return row ? accountOf(row) : null;
  }

  setWorkspaceHandle(accountId: string, handle: string, now: number): { account: Account; previous: string | null; previousChangedAt: number } {
    this.#db.exec("BEGIN IMMEDIATE");
    try {
      const row = this.#db.prepare("SELECT * FROM accounts WHERE id = ?").get(accountId) as AccountRow | undefined;
      if (!row) throw new Error("account not found");
      if (row.workspace_handle === handle) {
        this.#db.exec("COMMIT");
        return { account: accountOf(row), previous: row.workspace_handle, previousChangedAt: row.workspace_handle_changed_at };
      }
      if (row.workspace_handle_changed_at > now - WORKSPACE_HANDLE_COOLDOWN_MS) {
        throw new WorkspaceHandleCooldownError("workspace address can be changed once per hour");
      }
      const taken = this.#db.prepare(`SELECT id FROM accounts WHERE workspace_handle = ? AND id != ?
        UNION ALL SELECT account_id AS id FROM workspace_handle_aliases WHERE handle = ? LIMIT 1`)
        .get(handle, accountId, handle);
      if (taken) throw new WorkspaceHandleTakenError("workspace address is already taken");
      if (row.workspace_handle) {
        this.#db.prepare("INSERT INTO workspace_handle_aliases (handle, account_id, created_at) VALUES (?, ?, ?)")
          .run(row.workspace_handle, accountId, now);
      }
      try {
        this.#db.prepare("UPDATE accounts SET workspace_handle = ?, workspace_handle_changed_at = ? WHERE id = ?")
          .run(handle, now, accountId);
      } catch (error) {
        if (String(error).includes("UNIQUE constraint failed")) throw new WorkspaceHandleTakenError("workspace address is already taken");
        throw error;
      }
      const updated = this.#db.prepare("SELECT * FROM accounts WHERE id = ?").get(accountId) as AccountRow;
      this.#db.exec("COMMIT");
      return { account: accountOf(updated), previous: row.workspace_handle, previousChangedAt: row.workspace_handle_changed_at };
    } catch (error) {
      this.#db.exec("ROLLBACK");
      throw error;
    }
  }

  restoreWorkspaceHandle(accountId: string, expected: string, previous: string | null, previousChangedAt: number): void {
    this.#db.exec("BEGIN IMMEDIATE");
    try {
      this.#db.prepare(`UPDATE accounts SET workspace_handle = ?, workspace_handle_changed_at = ?
        WHERE id = ? AND workspace_handle = ?`).run(previous, previousChangedAt, accountId, expected);
      if (previous) this.#db.prepare("DELETE FROM workspace_handle_aliases WHERE account_id = ? AND handle = ?")
        .run(accountId, previous);
      this.#db.exec("COMMIT");
    } catch (error) {
      this.#db.exec("ROLLBACK");
      throw error;
    }
  }

  workspaceHandleAliases(accountId: string): string[] {
    return (this.#db.prepare(`SELECT handle FROM workspace_handle_aliases WHERE account_id = ?
      ORDER BY created_at DESC, handle LIMIT 8`).all(accountId) as Array<{ handle: string }>).map((row) => row.handle);
  }

  revokeSession(tokenHash: string): void {
    this.#db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
  }

  createWorkspaceHandoff(sessionHash: string, now: number): { slug: string; handle: string | null; code: string } | null {
    this.#db.exec("BEGIN IMMEDIATE");
    try {
      this.#db.prepare("DELETE FROM workspace_handoffs WHERE expires_at <= ?").run(now);
      const account = this.accountForSession(sessionHash, now);
      if (!account || account.workspaceState !== "active" || Math.max(account.paidThrough, account.trialThrough) <= now) {
        this.#db.exec("COMMIT");
        return null;
      }
      this.#db.prepare("DELETE FROM workspace_handoffs WHERE session_hash = ?").run(sessionHash);
      const code = randomBytes(32).toString("base64url");
      this.#db.prepare("INSERT INTO workspace_handoffs (code_hash, account_id, session_hash, expires_at) VALUES (?, ?, ?, ?)")
        .run(createHash("sha256").update(code).digest("hex"), account.id, sessionHash, now + 60_000);
      this.#db.exec("COMMIT");
      return { slug: account.slug, handle: account.workspaceHandle, code };
    } catch (error) {
      this.#db.exec("ROLLBACK");
      throw error;
    }
  }

  consumeWorkspaceHandoff(slug: string, codeHash: string, now: number): string | null {
    this.#db.exec("BEGIN IMMEDIATE");
    try {
      const row = this.#db.prepare(`SELECT h.account_id, h.expires_at, a.email, a.slug,
        a.paid_through, a.trial_expires_at, a.workspace_state, s.expires_at AS session_expires_at
        FROM workspace_handoffs h JOIN accounts a ON a.id = h.account_id
        JOIN sessions s ON s.token_hash = h.session_hash WHERE h.code_hash = ?`).get(codeHash) as {
          account_id: string; expires_at: number; email: string; slug: string;
          paid_through: number; trial_expires_at: number | null; workspace_state: string;
          session_expires_at: number;
        } | undefined;
      if (!row || row.slug !== slug) {
        this.#db.exec("COMMIT");
        return null;
      }
      this.#db.prepare("DELETE FROM workspace_handoffs WHERE code_hash = ?").run(codeHash);
      this.#db.exec("COMMIT");
      return row.expires_at > now && row.session_expires_at > now && row.workspace_state === "active" &&
        Math.max(row.paid_through, row.trial_expires_at ?? 0) > now ? row.email : null;
    } catch (error) {
      this.#db.exec("ROLLBACK");
      throw error;
    }
  }

  #occupiedWorkspaces(accountId: string, now: number): number {
    this.#db.prepare("DELETE FROM orders WHERE status = 'pending' AND created_at <= ?")
      .run(now - ORDER_TTL_MS);
    const result = this.#db.prepare(`SELECT COUNT(*) AS count FROM accounts a WHERE a.id != ?
      AND (a.paid_through > ? OR a.trial_expires_at > ? OR a.workspace_state IN ('active', 'error')
        OR EXISTS (SELECT 1 FROM orders o WHERE o.account_id = a.id AND o.status = 'pending'))`)
      .get(accountId, now, now) as { count: number };
    return result.count;
  }

  hasTrialCapacity(now: number, maxWorkspaces: number): boolean {
    const result = this.#db.prepare(`SELECT COUNT(*) AS count FROM accounts a
      WHERE a.paid_through > ? OR a.trial_expires_at > ? OR a.workspace_state IN ('active', 'error')
        OR EXISTS (SELECT 1 FROM orders o WHERE o.account_id = a.id AND o.status = 'pending' AND o.created_at > ?)`)
      .get(now, now, now - ORDER_TTL_MS) as { count: number };
    return result.count < maxWorkspaces;
  }

  createOrder(accountId: string, now: number, maxWorkspaces = Infinity): Order {
    this.#db.exec("BEGIN IMMEDIATE");
    try {
      const occupied = Number.isFinite(maxWorkspaces) ? this.#occupiedWorkspaces(accountId, now) : 0;
      const earlier = this.#db.prepare(`SELECT * FROM orders WHERE account_id = ? AND status = 'pending'
        ORDER BY created_at DESC LIMIT 1`).get(accountId) as OrderRow | undefined;
      if (earlier) {
        this.#db.exec("COMMIT");
        return orderOf(earlier);
      }
      if (occupied >= maxWorkspaces) throw new WorkspaceCapacityError("workspace capacity reached");
      const id = randomUUID();
      const code = `R2${randomBytes(8).toString("hex").toUpperCase()}`;
      this.#db.prepare(`INSERT INTO orders (id, account_id, code, amount, status, created_at)
        VALUES (?, ?, ?, ?, 'pending', ?)`).run(id, accountId, code, MONTHLY_PRICE_VND, now);
      this.#db.exec("COMMIT");
      return { id, accountId, code, amount: MONTHLY_PRICE_VND, status: "pending", createdAt: now, paidAt: null };
    } catch (error) {
      this.#db.exec("ROLLBACK");
      throw error;
    }
  }

  orderForAccount(id: string, accountId: string): Order | null {
    const row = this.#db.prepare("SELECT * FROM orders WHERE id = ? AND account_id = ?")
      .get(id, accountId) as OrderRow | undefined;
    return row ? orderOf(row) : null;
  }

  recordPayment(code: string | null, reference: string, amount: number, now: number): "paid" | "duplicate" | "unmatched" {
    if (!reference || !Number.isSafeInteger(amount) || amount < 0) throw new Error("invalid payment");
    this.#db.exec("BEGIN IMMEDIATE");
    try {
      if (this.#db.prepare("SELECT reference FROM payments WHERE reference = ?").get(reference) ||
        this.#db.prepare("SELECT reference FROM unmatched_payments WHERE reference = ?").get(reference)) {
        this.#db.exec("COMMIT");
        return "duplicate";
      }
      const order = code ? this.#db.prepare("SELECT * FROM orders WHERE code = ?").get(code) as OrderRow | undefined : undefined;
      if (!order || order.status !== "pending" || now - order.created_at >= ORDER_TTL_MS || amount !== order.amount) {
        const reason = !code ? "no-single-code" : !order ? "unknown-code" : order.status !== "pending" ? "order-already-paid"
          : now - order.created_at >= ORDER_TTL_MS ? "expired-order"
            : amount < order.amount ? "insufficient-amount" : "excess-amount";
        this.#db.prepare("INSERT INTO unmatched_payments (reference, code, amount, reason, received_at) VALUES (?, ?, ?, ?, ?)")
          .run(reference, code, amount, reason, now);
        this.#db.exec("COMMIT");
        return "unmatched";
      }
      this.#creditOrder(order, reference, amount, now, now);
      this.#db.exec("COMMIT");
      return "paid";
    } catch (error) {
      this.#db.exec("ROLLBACK");
      throw error;
    }
  }

  unmatchedPayments(): Array<{ reference: string; code: string | null; amount: number; reason: string; receivedAt: number }> {
    const rows = this.#db.prepare("SELECT * FROM unmatched_payments ORDER BY received_at DESC")
      .all() as Array<{ reference: string; code: string | null; amount: number; reason: string; received_at: number }>;
    return rows.map((row) => ({ reference: row.reference, code: row.code, amount: row.amount,
      reason: row.reason, receivedAt: row.received_at }));
  }

  assignUnmatched(reference: string, code: string, now: number): boolean {
    this.#db.exec("BEGIN IMMEDIATE");
    try {
      const row = this.#db.prepare("SELECT * FROM unmatched_payments WHERE reference = ?").get(reference) as
        { reference: string; amount: number; received_at: number } | undefined;
      const order = this.#db.prepare("SELECT * FROM orders WHERE code = ?").get(code) as OrderRow | undefined;
      if (!row || !order || order.status !== "pending" || row.amount !== order.amount) {
        this.#db.exec("ROLLBACK");
        return false;
      }
      this.#db.prepare("DELETE FROM unmatched_payments WHERE reference = ?").run(reference);
      this.#creditOrder(order, reference, row.amount, row.received_at, now);
      this.#db.prepare("INSERT INTO manual_reconciliations (reference, order_id, applied_at) VALUES (?, ?, ?)")
        .run(reference, order.id, now);
      this.#db.exec("COMMIT");
      return true;
    } catch (error) {
      this.#db.exec("ROLLBACK");
      throw error;
    }
  }

  #creditOrder(order: OrderRow, reference: string, amount: number, receivedAt: number, appliedAt: number): void {
    const account = this.#db.prepare("SELECT * FROM accounts WHERE id = ?").get(order.account_id) as AccountRow;
    const billingStart = Math.max(appliedAt, account.paid_through, account.trial_expires_at ?? 0);
    const anchorDay = account.billing_anchor_day ?? new Date(billingStart).getUTCDate();
    const paidThrough = nextMonthlyDate(billingStart, anchorDay);
    this.#db.prepare("INSERT INTO payments (reference, order_id, amount, received_at) VALUES (?, ?, ?, ?)")
      .run(reference, order.id, amount, receivedAt);
    this.#db.prepare("UPDATE orders SET status = 'paid', paid_at = ? WHERE id = ?").run(appliedAt, order.id);
    this.#db.prepare("UPDATE accounts SET paid_through = ?, billing_anchor_day = ? WHERE id = ?")
      .run(paidThrough, anchorDay, account.id);
  }

  pendingWorkspaceActions(now: number): Array<{ account: Account; action: "activate" | "suspend" }> {
    const rows = this.#db.prepare("SELECT * FROM accounts WHERE paid_through > 0 OR trial_expires_at > 0").all() as AccountRow[];
    return rows.flatMap((row) => {
      const action = Math.max(row.paid_through, row.trial_expires_at ?? 0) > now ? "activate" : "suspend";
      if (action === "activate" && row.workspace_state === "active") return [];
      if (action === "suspend" && row.workspace_state !== "active" && row.workspace_state !== "error") return [];
      return [{ account: accountOf(row), action }];
    });
  }

  activeWorkspaceAccounts(now: number): Account[] {
    const rows = this.#db.prepare(`SELECT * FROM accounts WHERE workspace_state = 'active'
      AND MAX(paid_through, COALESCE(trial_expires_at, 0)) > ?`).all(now) as AccountRow[];
    return rows.map(accountOf);
  }

  setWorkspaceState(accountId: string, state: WorkspaceState): void {
    this.#db.prepare("UPDATE accounts SET workspace_state = ? WHERE id = ?").run(state, accountId);
  }
}
