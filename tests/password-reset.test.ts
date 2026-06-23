import { describe, it, expect } from "vitest";
import {
  generateResetToken,
  hashResetToken,
  resetTokenExpiry,
  isTokenExpired,
  RESET_TOKEN_TTL_MS,
} from "@/lib/auth/password-reset";

describe("password-reset", () => {
  it("hashResetToken deterministik (aynı girdi → aynı hash)", () => {
    expect(hashResetToken("abc")).toBe(hashResetToken("abc"));
  });

  it("hashResetToken farklı girdi → farklı hash, 64 hex karakter", () => {
    const a = hashResetToken("token-1");
    const b = hashResetToken("token-2");
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hash, ham token'ı sızdırmaz", () => {
    const token = "super-secret-token";
    expect(hashResetToken(token)).not.toContain(token);
  });

  it("generateResetToken URL-güvenli ve her seferinde farklı", () => {
    const t1 = generateResetToken();
    const t2 = generateResetToken();
    expect(t1).not.toBe(t2);
    expect(t1).toMatch(/^[A-Za-z0-9_-]+$/); // base64url
    expect(t1.length).toBeGreaterThanOrEqual(40);
  });

  it("resetTokenExpiry = now + TTL", () => {
    const now = 1_000_000;
    expect(resetTokenExpiry(now).getTime()).toBe(now + RESET_TOKEN_TTL_MS);
  });

  it("isTokenExpired: gelecekteki tarih → false, geçmiş → true", () => {
    const now = 1_000_000;
    expect(isTokenExpired(new Date(now + 1000), now)).toBe(false);
    expect(isTokenExpired(new Date(now - 1000), now)).toBe(true);
  });

  it("isTokenExpired sınır: tam now anında süresi dolmuş sayılmaz", () => {
    const now = 1_000_000;
    expect(isTokenExpired(new Date(now), now)).toBe(false);
  });
});
