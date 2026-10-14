import { PolarBillingService, type WebhookEventType } from "@orkide/billing";

export interface BillingEnvironment {
  POLAR_ACCESS_TOKEN: string;
  POLAR_SERVER?: "sandbox" | "production";
  POLAR_WEBHOOK_SECRET: string;
}

export class BillingModuleService {
  private billing: PolarBillingService;

  constructor(env: BillingEnvironment) {
    this.billing = new PolarBillingService({
      accessToken: env.POLAR_ACCESS_TOKEN,
      server: env.POLAR_SERVER || "sandbox",
      webhookSecret: env.POLAR_WEBHOOK_SECRET,
    });
  }

  async startCheckout(userId: string, email: string, productId: string, successUrl: string) {
    return this.billing.createCheckoutSession({
      productId,
      customerEmail: email,
      successUrl,
      metadata: { userId },
    });
  }

  async openPortal(polarCustomerId: string) {
    return this.billing.createCustomerPortalSession({
      customerId: polarCustomerId,
    });
  }

  async handleWebhookEvent(type: WebhookEventType, data: any) {
    switch (type) {
      case "subscription.created":
      case "subscription.active":
        // Aktualizacja uprawnień RBAC użytkownika na 'PRO'
        return { action: "grant_entitlement", userId: data?.metadata?.userId, status: "active" };

      case "subscription.canceled":
      case "subscription.revoked":
        // Odwołanie uprawnień RBAC
        return { action: "revoke_entitlement", userId: data?.metadata?.userId, status: "revoked" };

      case "order.created":
        return { action: "order_processed", orderId: data?.id };

      default:
        return { action: "ignored", type };
    }
  }
}
