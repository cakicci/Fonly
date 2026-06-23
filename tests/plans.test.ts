import { describe, it, expect } from "vitest";
import { isPlanId, getPlan, periodEndFrom, PLAN_MAP } from "@/lib/billing/plans";

describe("isPlanId", () => {
  it("geçerli plan id'lerini tanır", () => {
    expect(isPlanId("monthly")).toBe(true);
    expect(isPlanId("yearly")).toBe(true);
  });
  it("geçersizleri reddeder", () => {
    expect(isPlanId("weekly")).toBe(false);
    expect(isPlanId(null)).toBe(false);
    expect(isPlanId(undefined)).toBe(false);
    expect(isPlanId(42)).toBe(false);
  });
});

describe("getPlan", () => {
  it("geçerli id → plan nesnesi", () => {
    expect(getPlan("yearly")?.id).toBe("yearly");
    expect(getPlan("monthly")?.intervalMonths).toBe(1);
  });
  it("geçersiz id → null", () => {
    expect(getPlan("x")).toBeNull();
    expect(getPlan(null)).toBeNull();
  });
});

describe("periodEndFrom", () => {
  it("aylık → 1 ay ekler", () => {
    const end = periodEndFrom(new Date(2026, 0, 15), PLAN_MAP.monthly);
    expect([end.getFullYear(), end.getMonth(), end.getDate()]).toEqual([2026, 1, 15]);
  });

  it("yıllık → 12 ay ekler", () => {
    const end = periodEndFrom(new Date(2026, 0, 15), PLAN_MAP.yearly);
    expect([end.getFullYear(), end.getMonth(), end.getDate()]).toEqual([2027, 0, 15]);
  });

  it("yıl sınırını aşar (Aralık → Ocak)", () => {
    const end = periodEndFrom(new Date(2026, 11, 15), PLAN_MAP.monthly);
    expect([end.getFullYear(), end.getMonth(), end.getDate()]).toEqual([2027, 0, 15]);
  });

  it("ay sonu taşmasını güvenli ele alır (31 Oca + 1 ay → 28 Şub)", () => {
    const end = periodEndFrom(new Date(2026, 0, 31), PLAN_MAP.monthly);
    // 2026 artık yıl değil → Şubat 28
    expect([end.getMonth(), end.getDate()]).toEqual([1, 28]);
  });
});
