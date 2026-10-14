export interface PolarBillingConfig {
  accessToken: string;
  server?: "sandbox" | "production";
  webhookSecret?: string;
}

export interface CreateCheckoutParams {
  productId: string;
  customerEmail: string;
  successUrl: string;
  metadata?: Record<string, string>;
}

export interface CustomerPortalParams {
  customerId: string;
}

export type WebhookEventType =
  | "checkout.created"
  | "checkout.updated"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.active"
  | "subscription.canceled"
  | "subscription.revoked"
  | "order.created";

export interface PolarWebhookPayload<T = unknown> {
  type: WebhookEventType;
  data: T;
  timestamp: string;
}
