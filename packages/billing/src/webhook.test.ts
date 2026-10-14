import { describe, it, expect } from "vitest";
import { verifyPolarWebhookSignature, parsePolarWebhook } from "../src/packages/billing/src/webhook";

describe("Polar Webhook Verification", () => {
  const secret = "sample_test_secret_for_vitest";
  const now = Math.floor(Date.now() / 1000).toString();
  const id = "msg_polar_test_123";
  const payload = JSON.stringify({
    type: "subscription.active",
    data: { id: "sub_polar_abc", metadata: { userId: "user_42" } },
    timestamp: new Date().toISOString(),
  });

  it("should parse polar webhook payload correctly", () => {
    const event = parsePolarWebhook(payload);
    expect(event.type).toBe("subscription.active");
    expect((event.data as any).id).toBe("sub_polar_abc");
  });

  it("should reject expired timestamp (replay prevention)", async () => {
    const oldTimestamp = (Math.floor(Date.now() / 1000) - 400).toString();
    const isValid = await verifyPolarWebhookSignature(
      payload,
      { id, timestamp: oldTimestamp, signature: "v1,invalid" },
      secret
    );
    expect(isValid).toBe(false);
  });

  it("should reject invalid signature format", async () => {
    const isValid = await verifyPolarWebhookSignature(
      payload,
      { id, timestamp: now, signature: "v1,invalid_sig" },
      secret
    );
    expect(isValid).toBe(false);
  });
});
