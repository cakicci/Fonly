import { describe, it, expect } from "vitest";
import { createDevToken, verifyDevToken } from "@/lib/billing/dev-token";

describe("dev-token", () => {
  it("imzalama → doğrulama roundtrip", () => {
    const token = createDevToken("user_123", "monthly");
    expect(verifyDevToken(token)).toEqual({ userId: "user_123", plan: "monthly" });
  });

  it("yıllık plan da taşınır", () => {
    const token = createDevToken("u", "yearly");
    expect(verifyDevToken(token)?.plan).toBe("yearly");
  });

  it("kurcalanmış token → null", () => {
    const token = createDevToken("user_123", "monthly");
    const tampered = token.slice(0, -1) + (token.endsWith("A") ? "B" : "A");
    expect(verifyDevToken(tampered)).toBeNull();
  });

  it("payload kurcalanırsa imza tutmaz → null", () => {
    const token = createDevToken("user_123", "monthly");
    const [, sig] = token.split(".");
    const fakePayload = Buffer.from(
      JSON.stringify({ userId: "attacker", plan: "yearly", exp: Date.now() + 10000 })
    ).toString("base64url");
    expect(verifyDevToken(`${fakePayload}.${sig}`)).toBeNull();
  });

  it("süresi dolmuş token → null", () => {
    const expired = createDevToken("u", "monthly", -1000);
    expect(verifyDevToken(expired)).toBeNull();
  });

  it("biçimsiz girdi → null", () => {
    expect(verifyDevToken(null)).toBeNull();
    expect(verifyDevToken(undefined)).toBeNull();
    expect(verifyDevToken("no-dot-here")).toBeNull();
    expect(verifyDevToken("")).toBeNull();
  });
});
