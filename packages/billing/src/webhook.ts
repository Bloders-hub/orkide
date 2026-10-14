import type { PolarWebhookPayload } from "./types";

/**
 * Weryfikuje podpis kryptograficzny Standard Webhook (Svix/Polar)
 * Kompatybilny ze standardem Web Crypto API (Cloudflare Workers, Hono, Node 18+)
 */
export async function verifyPolarWebhookSignature(
  payloadText: string,
  headers: {
    id: string;
    timestamp: string;
    signature: string;
  },
  webhookSecret: string
): Promise<boolean> {
  if (!headers.id || !headers.timestamp || !headers.signature || !webhookSecret) {
    return false;
  }

  // Zabezpieczenie przed atakami typu replay (tolerancja max 5 minut)
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(headers.timestamp, 10);
  if (isNaN(ts) || Math.abs(now - ts) > 300) {
    return false;
  }

  // Standardowy format wiadomości: `${id}.${timestamp}.${body}`
  const signedPayload = `${headers.id}.${headers.timestamp}.${payloadText}`;
  const enc = new TextEncoder();

  try {
    // Normalizacja klucza: jeśli zaczyna się od prefixu 'whsec_'
    const rawSecret = webhookSecret.startsWith("whsec_")
      ? webhookSecret.slice(6)
      : webhookSecret;

    // Klucz może być w base64 lub plain text
    let secretKeyBytes: Uint8Array;
    try {
      const binaryString = atob(rawSecret);
      secretKeyBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        secretKeyBytes[i] = binaryString.charCodeAt(i);
      }
    } catch {
      secretKeyBytes = enc.encode(rawSecret);
    }

    const key = await crypto.subtle.importKey(
      "raw",
      secretKeyBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      enc.encode(signedPayload)
    );

    const expectedSignature = btoa(
      String.fromCharCode(...new Uint8Array(signatureBuffer))
    );

    // Weryfikacja sygnatur (nagłówek może zawierać np. v1,sygnatura)
    const signatures = headers.signature.split(" ");
    for (const sig of signatures) {
      const cleanSig = sig.startsWith("v1,") ? sig.slice(3) : sig;
      if (cleanSig === expectedSignature) {
        return true;
      }
    }

    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Bezpiecznie parsuje zweryfikowany payload zdarzenia Polar
 */
export function parsePolarWebhook(payloadText: string): PolarWebhookPayload {
  return JSON.parse(payloadText) as PolarWebhookPayload;
}
