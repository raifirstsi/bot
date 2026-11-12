import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  loadSavedContextVault,
  saveContextVaultToStorage,
} from "./ContextVaultModal.tsx";
import { CONTEXT_PILLARS, type ContextPillarId } from "../lib/context-vault.ts";

describe("ContextVaultModal - Storage & Logic", () => {
  let memoryStore: Record<string, string> = {};

  beforeEach(() => {
    memoryStore = {};
    const mockLocalStorage = {
      getItem: (key: string) => memoryStore[key] || null,
      setItem: (key: string, value: string) => {
        memoryStore[key] = value;
      },
      removeItem: (key: string) => {
        delete memoryStore[key];
      },
      clear: () => {
        memoryStore = {};
      },
    };

    (globalThis as unknown as { window: { localStorage: typeof mockLocalStorage } }).window = {
      localStorage: mockLocalStorage,
    };
  });

  afterEach(() => {
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  it("returns null when no context vault has been saved yet", () => {
    const loaded = loadSavedContextVault();
    expect(loaded).toBeNull();
  });

  it("correctly saves and loads context vault data from storage", () => {
    const initial: Record<ContextPillarId, string> = {} as any;
    for (const key of Object.keys(CONTEXT_PILLARS)) {
      initial[key as ContextPillarId] = `Custom content for ${key}`;
    }

    saveContextVaultToStorage(initial);
    const loaded = loadSavedContextVault();

    expect(loaded).not.toBeNull();
    expect(loaded?.brand_voice).toBe("Custom content for brand_voice");
    expect(loaded?.offer_breakdown).toBe("Custom content for offer_breakdown");
    expect(loaded?.customer_avatar).toBe("Custom content for customer_avatar");
  });
});
