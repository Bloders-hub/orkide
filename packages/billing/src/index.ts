import { Polar } from "@polar-sh/sdk";
import type {
  PolarBillingConfig,
  CreateCheckoutParams,
  CustomerPortalParams,
} from "./types";

export * from "./types";
export * from "./webhook";

export class PolarBillingService {
  private client: Polar;
  private server: "sandbox" | "production";

  constructor(config: PolarBillingConfig) {
    this.server = config.server || "sandbox";
    this.client = new Polar({
      accessToken: config.accessToken,
      server: this.server,
    });
  }

  /**
   * Generuje sesję checkout dla zakupu produktu lub subskrypcji
   */
  async createCheckoutSession(params: CreateCheckoutParams) {
    const session = await this.client.checkouts.custom.create({
      productId: params.productId,
      customerEmail: params.customerEmail,
      successUrl: params.successUrl,
      metadata: params.metadata || {},
    });
    return session;
  }

  /**
   * Generuje link do portalu klienta Polar (zarządzanie subskrypcją)
   */
  async createCustomerPortalSession(params: CustomerPortalParams) {
    const session = await this.client.customerSessions.create({
      customerId: params.customerId,
    });
    return session;
  }

  /**
   * Pobiera listę aktywnych subskrypcji dla danego klienta
   */
  async listSubscriptions(customerId: string) {
    const list = await this.client.subscriptions.list({
      customerId,
      active: true,
    });
    return list;
  }
}
