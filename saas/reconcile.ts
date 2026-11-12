import { join } from "node:path";
import { SaasStore } from "./store.ts";

const dataDir = process.env.RAI2_SAAS_DATA_DIR?.trim();
if (!dataDir) throw new Error("RAI2_SAAS_DATA_DIR is required");
const [action, reference, code] = process.argv.slice(2);
const store = new SaasStore(join(dataDir, "saas.db"));
try {
  if (action === "list" && reference === undefined) {
    console.log(JSON.stringify(store.unmatchedPayments(), null, 2));
  } else if (action === "assign" && reference && /^sepay:[1-9][0-9]{0,19}$/.test(reference) &&
    code && /^R2[A-F0-9]{16}$/.test(code)) {
    if (!store.assignUnmatched(reference, code, Date.now())) throw new Error("payment or pending order is unavailable, or amount is insufficient");
    console.log("payment assigned once; workspace reconciliation will run on the next cycle");
  } else {
    throw new Error("Usage: node reconcile.js list | assign sepay:TRANSACTION_ID R2ORDER_CODE");
  }
} finally {
  store.close();
}
