import { Hono } from "hono";
import { verifyPolarWebhookSignature, parsePolarWebhook } from "@orkide/billing";
import { BillingModuleService, type BillingEnvironment } from "./billing.service";

export const billingRoutes = new Hono<{ Bindings: BillingEnvironment }>();

/**
 * POST /api/v1/billing/checkout
 * Inicjalizuje sesję zakupową w Polar
 */
billingRoutes.post("/checkout", async (c) => {
  const body = await c.req.json();
  const service = new BillingModuleService(c.env);

  try {
    const session = await service.startCheckout(
      body.userId,
      body.email,
      body.productId,
      body.successUrl
    );
    return c.json({ ok: true, session });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 400);
  }
});

/**
 * GET /api/v1/billing/portal
 * Generuje link do portalu klienta (zarządzanie subskrypcją i kartami)
 */
billingRoutes.get("/portal", async (c) => {
  const customerId = c.req.query("customerId");
  if (!customerId) {
    return c.json({ ok: false, error: "Missing customerId" }, 400);
  }

  const service = new BillingModuleService(c.env);
  try {
    const session = await service.openPortal(customerId);
    return c.json({ ok: true, session });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 400);
  }
});

/**
 * POST /api/v1/billing/webhook
 * Obsługuje i weryfikuje podpisy zdarzeń Polar.sh (Standard Webhooks / Svix)
 */
billingRoutes.post("/webhook", async (c) => {
  const payloadText = await c.req.text();
  const id = c.req.header("webhook-id") || "";
  const timestamp = c.req.header("webhook-timestamp") || "";
  const signature = c.req.header("webhook-signature") || "";

  const isValid = await verifyPolarWebhookSignature(
    payloadText,
    { id, timestamp, signature },
    c.env.POLAR_WEBHOOK_SECRET
  );

  if (!isValid) {
    return c.json({ ok: false, error: "Invalid webhook signature" }, 401);
  }

  const event = parsePolarWebhook(payloadText);
  const service = new BillingModuleService(c.env);
  const result = await service.handleWebhookEvent(event.type, event.data);

  return c.json({ ok: true, result });
});
