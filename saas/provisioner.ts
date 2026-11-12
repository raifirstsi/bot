import { fleetRequest, type FleetReply } from "../server/fleet-client.ts";
import type { SaasStore } from "./store.ts";
import { tenantToken } from "./tenant-auth.ts";

export interface FleetTransport {
  (method: string, path: string, body?: unknown): Promise<FleetReply>;
}

type FleetWorkspace = { slug: string; status: string; publicHost?: string };

export function socketFleet(socketPath: string): FleetTransport {
  return (method, path, body) => fleetRequest(socketPath, method, path, body);
}

export class WorkspaceProvisioner {
  readonly #store: SaasStore;
  readonly #fleet: FleetTransport;
  readonly #tenantAuthOrigin: string;
  readonly #tenantSigningKey: string;
  readonly #tenantDomain: string;
  readonly #onFailure?: (slug: string, action: "activate" | "suspend" | "host") => void;
  #running = false;

  constructor(options: { store: SaasStore; fleet: FleetTransport; tenantAuthOrigin: string; tenantSigningKey: string;
    tenantDomain: string; onFailure?: (slug: string, action: "activate" | "suspend" | "host") => void }) {
    this.#store = options.store;
    this.#fleet = options.fleet;
    this.#tenantAuthOrigin = options.tenantAuthOrigin;
    this.#tenantSigningKey = options.tenantSigningKey;
    this.#tenantDomain = options.tenantDomain;
    this.#onFailure = options.onFailure;
  }

  async reconcile(now = Date.now()): Promise<void> {
    if (this.#running) return;
    this.#running = true;
    try {
      for (const { account, action } of this.#store.pendingWorkspaceActions(now)) {
        try {
          const workspace = await this.#workspace(account.slug);
          if (action === "activate") {
            if (!workspace) {
              await this.#expectSuccess("POST", "/workspaces", {
                slug: account.slug, admins: [account.email], members: [],
                memory: "2G",
                rai2Tenant: true,
                tenantAuthOrigin: this.#tenantAuthOrigin,
                tenantAuthToken: tenantToken(this.#tenantSigningKey, account.slug),
              });
            } else if (workspace.status === "suspended") {
              await this.#expectSuccess("POST", `/workspaces/${account.slug}/resume`);
            } else if (workspace.status !== "running") {
              throw new Error("workspace requires operator recovery");
            }
            this.#store.setWorkspaceState(account.id, "active");
          } else {
            if (workspace?.status === "running") {
              await this.#expectSuccess("POST", `/workspaces/${account.slug}/suspend`);
            } else if (workspace && workspace.status !== "suspended") {
              throw new Error("workspace requires operator recovery");
            }
            this.#store.setWorkspaceState(account.id, "suspended");
          }
        } catch {
          this.#store.setWorkspaceState(account.id, "error");
          this.#onFailure?.(account.slug, action);
        }
      }
      for (const account of this.#store.activeWorkspaceAccounts(now)) {
        if (!account.workspaceHandle) continue;
        try {
          const workspace = await this.#workspace(account.slug);
          if (!workspace || workspace.status !== "running") continue;
          const host = `${account.workspaceHandle}.${this.#tenantDomain}`;
          if (workspace.publicHost !== host) await this.setPublicHost(account.slug, host,
            this.#store.workspaceHandleAliases(account.id).map((alias) => `${alias}.${this.#tenantDomain}`));
        } catch {
          this.#onFailure?.(account.slug, "host");
        }
      }
    } finally {
      this.#running = false;
    }
  }

  async setPublicHost(slug: string, host: string, legacyHosts: string[] = []): Promise<void> {
    await this.#expectSuccess("POST", `/workspaces/${slug}/host`, { host, legacyHosts });
  }

  async #workspace(slug: string): Promise<FleetWorkspace | null> {
    const reply = await this.#fleet("GET", "/workspaces");
    if (reply.status !== 200 || !reply.body || typeof reply.body !== "object") throw new Error("fleet unavailable");
    const workspaces = Reflect.get(reply.body, "workspaces");
    if (!Array.isArray(workspaces)) throw new Error("fleet returned no workspace list");
    const row = workspaces.find((candidate) => candidate?.slug === slug);
    if (!row) return null;
    if (typeof row.status !== "string" || (row.publicHost !== undefined && typeof row.publicHost !== "string")) {
      throw new Error("fleet returned an invalid workspace state");
    }
    return { slug, status: row.status, ...(row.publicHost ? { publicHost: row.publicHost } : {}) };
  }

  async #expectSuccess(method: string, path: string, body?: unknown): Promise<void> {
    const reply = await this.#fleet(method, path, body);
    if (reply.status !== 200) throw new Error("fleet operation failed");
  }
}
