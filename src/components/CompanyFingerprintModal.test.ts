import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  loadSavedFingerprint,
  saveFingerprintToStorage,
  type CompanyFingerprintData,
} from "./CompanyFingerprintModal";
import { INDUSTRY_PRICE_BOOKS, getPriceBookById } from "@/lib/industry-price-books";

describe("CompanyFingerprintModal - Logic & Storage", () => {
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

  it("returns null when no fingerprint has been saved yet", () => {
    const loaded = loadSavedFingerprint();
    expect(loaded).toBeNull();
  });

  it("correctly saves and loads fingerprint from localStorage", () => {
    const sample: CompanyFingerprintData = {
      industryId: "interior_fitout",
      companyName: "Công ty Thiết kế Kiến Trúc X",
      targetNetMargin: 40,
      maxDiscountAllowed: 5,
      paymentMilestones: [
        "Đợt 1: Tạm ứng 40%",
        "Đợt 2: Thanh toán 45%",
        "Đợt 3: Quyết toán 15%",
      ],
      rulesPrompt: "Sample rules prompt",
      sourceType: "turnkey_preset",
      updatedAt: "2026-11-11T12:00:00.000Z",
    };

    saveFingerprintToStorage(sample);
    const retrieved = loadSavedFingerprint();

    expect(retrieved).not.toBeNull();
    expect(retrieved?.companyName).toBe("Công ty Thiết kế Kiến Trúc X");
    expect(retrieved?.targetNetMargin).toBe(40);
    expect(retrieved?.paymentMilestones.length).toBe(3);
    expect(retrieved?.sourceType).toBe("turnkey_preset");
  });

  it("handles all 4 turnkey industries seamlessly", () => {
    const expectedIds = ["interior_fitout", "hvac_aluminum", "b2b_agency", "retail_distribution"];
    expect(INDUSTRY_PRICE_BOOKS.length).toBe(4);

    for (const id of expectedIds) {
      const book = getPriceBookById(id);
      expect(book).toBeDefined();
      expect(book!.defaultNetMargin).toBeGreaterThanOrEqual(0.35);
      expect(book!.unitPrices.length).toBeGreaterThan(0);
      expect(book!.commonObjections.length).toBeGreaterThan(0);
    }
  });
});
