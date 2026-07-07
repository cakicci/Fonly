import { describe, expect, it } from "vitest";
import crypto from "crypto";
import {
  buildIyzicoAuthHeaders,
  computeSubscriptionWebhookSignature,
  type IyzicoSubscriptionWebhook,
} from "@/lib/billing/providers/iyzico";

const CFG = {
  apiKey: "sandbox-api-key",
  secretKey: "sandbox-secret-key",
  merchantId: "123456",
};

describe("buildIyzicoAuthHeaders", () => {
  it("IYZWSv2 formatında deterministik başlık üretir", () => {
    const headers = buildIyzicoAuthHeaders(
      CFG,
      "/v2/subscription/checkoutform/initialize",
      '{"locale":"tr"}',
      "1700000000000FONLY"
    );

    expect(headers["x-iyzi-rnd"]).toBe("1700000000000FONLY");
    expect(headers.Authorization).toMatch(/^IYZWSv2 [A-Za-z0-9+/=]+$/);

    // Base64 çözülünce apiKey + randomKey + hex imza taşımalı.
    const decoded = Buffer.from(
      headers.Authorization.replace("IYZWSv2 ", ""),
      "base64"
    ).toString("utf8");
    expect(decoded).toContain(`apiKey:${CFG.apiKey}`);
    expect(decoded).toContain("&randomKey:1700000000000FONLY");
    expect(decoded).toMatch(/&signature:[0-9a-f]{64}$/);

    // İmza dokümandaki formülle birebir: HMAC(secret, randomKey+path+body) hex.
    const expected = crypto
      .createHmac("sha256", CFG.secretKey)
      .update("1700000000000FONLY/v2/subscription/checkoutform/initialize" + '{"locale":"tr"}')
      .digest("hex");
    expect(decoded.endsWith(`&signature:${expected}`)).toBe(true);
  });

  it("farklı body farklı imza üretir", () => {
    const a = buildIyzicoAuthHeaders(CFG, "/x", "{}", "R");
    const b = buildIyzicoAuthHeaders(CFG, "/x", '{"a":1}', "R");
    expect(a.Authorization).not.toBe(b.Authorization);
  });
});

describe("computeSubscriptionWebhookSignature", () => {
  const payload: IyzicoSubscriptionWebhook = {
    iyziEventType: "subscription.order.success",
    subscriptionReferenceCode: "sub-ref-1",
    orderReferenceCode: "order-ref-1",
    customerReferenceCode: "cust-ref-1",
  };

  it("dokümandaki alan sırasıyla hex HMAC üretir", () => {
    const sig = computeSubscriptionWebhookSignature(CFG, payload);
    const expected = crypto
      .createHmac("sha256", CFG.secretKey)
      .update(
        CFG.merchantId +
          CFG.secretKey +
          "subscription.order.success" +
          "sub-ref-1" +
          "order-ref-1" +
          "cust-ref-1"
      )
      .digest("hex");
    expect(sig).toBe(expected);
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it("payload alanı değişince imza değişir (kurcalama tespiti)", () => {
    const original = computeSubscriptionWebhookSignature(CFG, payload);
    const tampered = computeSubscriptionWebhookSignature(CFG, {
      ...payload,
      subscriptionReferenceCode: "sub-ref-BASKASI",
    });
    expect(tampered).not.toBe(original);
  });

  it("farklı secret farklı imza üretir", () => {
    const other = computeSubscriptionWebhookSignature(
      { ...CFG, secretKey: "baska-secret" },
      payload
    );
    expect(other).not.toBe(computeSubscriptionWebhookSignature(CFG, payload));
  });
});
