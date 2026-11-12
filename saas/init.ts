import { existsSync } from "node:fs";
import { join } from "node:path";
import { SaasStore } from "./store.ts";

const dataDir = process.env.RAI2_SAAS_DATA_DIR?.trim();
if (!dataDir) throw new Error("RAI2_SAAS_DATA_DIR is required");
const file = join(dataDir, "saas.db");
if (existsSync(file)) throw new Error("SaaS database already exists; initialization is a one-time action");
const store = new SaasStore(file);
store.close();
console.log("RAI2 SaaS database initialized");
