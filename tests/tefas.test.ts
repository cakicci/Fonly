import { describe, it, expect } from "vitest";
import { normalizeTurkish, tefasRiskToCategory } from "@/lib/tefas";

describe("normalizeTurkish", () => {
  it("Türkçe aksanlı harfleri ASCII'ye indirger", () => {
    expect(normalizeTurkish("ÇİĞDEM")).toBe("cigdem");
    expect(normalizeTurkish("İSTANBUL")).toBe("istanbul");
    expect(normalizeTurkish("Işık")).toBe("isik");
    expect(normalizeTurkish("ŞÖFÖR")).toBe("sofor");
    expect(normalizeTurkish("Güneş")).toBe("gunes");
  });

  it("zaten ASCII olan metni değiştirmez (küçük harf hariç)", () => {
    expect(normalizeTurkish("AKBNK")).toBe("akbnk");
  });
});

describe("tefasRiskToCategory", () => {
  it.each([
    ["1", "low"],
    ["3", "low"],
    ["4", "medium"],
    ["5", "medium"],
    ["6", "high"],
    ["7", "high"],
  ])("risk %s → %s", (input, expected) => {
    expect(tefasRiskToCategory(input)).toBe(expected);
  });

  it("null/undefined/boş → null", () => {
    expect(tefasRiskToCategory(null)).toBeNull();
    expect(tefasRiskToCategory(undefined)).toBeNull();
    expect(tefasRiskToCategory("")).toBeNull();
  });

  it("sayı olmayan → null", () => {
    expect(tefasRiskToCategory("abc")).toBeNull();
  });
});
