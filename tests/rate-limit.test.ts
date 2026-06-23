import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, getClientIp, __resetRateLimitStore } from "@/lib/rate-limit";

beforeEach(() => __resetRateLimitStore());

describe("rateLimit", () => {
  it("limit dahilindeki istekleri geçirir, remaining azalır", () => {
    const opts = { limit: 3, windowMs: 1000, now: 1000 };
    expect(rateLimit("k", opts)).toMatchObject({ ok: true, remaining: 2 });
    expect(rateLimit("k", opts)).toMatchObject({ ok: true, remaining: 1 });
    expect(rateLimit("k", opts)).toMatchObject({ ok: true, remaining: 0 });
  });

  it("limit aşılınca ok=false ve retryAfter > 0", () => {
    const opts = { limit: 2, windowMs: 5000, now: 1000 };
    rateLimit("k", opts);
    rateLimit("k", opts);
    const blocked = rateLimit("k", opts);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBe(5); // 5000ms → 5sn
  });

  it("pencere dolunca sayaç sıfırlanır", () => {
    rateLimit("k", { limit: 1, windowMs: 1000, now: 1000 });
    const blocked = rateLimit("k", { limit: 1, windowMs: 1000, now: 1500 });
    expect(blocked.ok).toBe(false);
    // Pencere geçti (now=2001 > resetAt=2000)
    const fresh = rateLimit("k", { limit: 1, windowMs: 1000, now: 2001 });
    expect(fresh.ok).toBe(true);
  });

  it("farklı anahtarlar bağımsız kovalar", () => {
    const opts = { limit: 1, windowMs: 1000, now: 1000 };
    expect(rateLimit("a", opts).ok).toBe(true);
    expect(rateLimit("b", opts).ok).toBe(true);
    expect(rateLimit("a", opts).ok).toBe(false);
  });
});

describe("getClientIp", () => {
  it("x-forwarded-for'un ilk değerini alır", () => {
    const req = new Request("https://x", {
      headers: { "x-forwarded-for": "203.0.113.5, 70.41.3.18" },
    });
    expect(getClientIp(req)).toBe("203.0.113.5");
  });

  it("x-forwarded-for yoksa x-real-ip", () => {
    const req = new Request("https://x", { headers: { "x-real-ip": "198.51.100.7" } });
    expect(getClientIp(req)).toBe("198.51.100.7");
  });

  it("hiçbiri yoksa 'unknown'", () => {
    expect(getClientIp(new Request("https://x"))).toBe("unknown");
  });
});
