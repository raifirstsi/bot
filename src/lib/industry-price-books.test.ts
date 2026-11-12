import { describe, expect, it } from "vitest";
import {
  INDUSTRY_PRICE_BOOKS,
  getPriceBookById,
  formatPriceBookAsPromptRules,
} from "./industry-price-books";

describe("Industry Price Books Registry", () => {
  it("defines exactly 4 turnkey industry price books", () => {
    expect(INDUSTRY_PRICE_BOOKS.length).toBe(4);
    const ids = INDUSTRY_PRICE_BOOKS.map((b) => b.id);
    expect(ids).toContain("interior_fitout");
    expect(ids).toContain("hvac_aluminum");
    expect(ids).toContain("b2b_agency");
    expect(ids).toContain("retail_distribution");
  });

  it("ensures every price book has net margin >= 30% and valid unit prices", () => {
    for (const book of INDUSTRY_PRICE_BOOKS) {
      expect(book.defaultNetMargin).toBeGreaterThanOrEqual(0.30);
      expect(book.unitPrices.length).toBeGreaterThan(0);
      expect(book.paymentTerms.length).toBeGreaterThan(0);
      expect(book.commonObjections.length).toBeGreaterThan(0);

      // Verify selling price is greater than cost price
      for (const item of book.unitPrices) {
        expect(item.sellingPrice).toBeGreaterThan(item.costPrice);
        const margin = (item.sellingPrice - item.costPrice) / item.sellingPrice;
        expect(margin).toBeGreaterThanOrEqual(0.30);
      }
    }
  });

  it("retrieves price books accurately by id", () => {
    const fitout = getPriceBookById("interior_fitout");
    expect(fitout).toBeDefined();
    expect(fitout?.name).toContain("Nội Thất");

    const invalid = getPriceBookById("non_existent");
    expect(invalid).toBeUndefined();
  });

  it("formats price book as clear markdown prompt rules", () => {
    const fitout = getPriceBookById("interior_fitout")!;
    const rules = formatPriceBookAsPromptRules(fitout);
    expect(rules).toContain("BẢNG GIÁ & QUY TẮC KINH DOANH CHUẨN");
    expect(rules).toContain("Tủ bếp trên thùng MDF");
    expect(rules).toContain("KỊCH BẢN BẺ TỪ CHỐI GIÁ CAO");
  });
});
