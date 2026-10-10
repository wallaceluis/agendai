import { createHmac, timingSafeEqual } from "node:crypto";

export const PLAN_PRICE = Number(process.env.PLAN_PRICE ?? 39.9);
export const TRIAL_DAYS = Number(process.env.TRIAL_DAYS ?? 14);
export const PLAN_NAME = "Agendaí Profissional";

type BillingState = {
  subscriptionStatus: string;
  trialEndsAt: Date;
  currentPeriodEnd: Date | null;
};

/** Pode receber agendamentos online? Em teste grátis ou com assinatura em dia. */
export function hasAccess(b: BillingState, now = new Date()): boolean {
  if (b.subscriptionStatus === "active") return true;
  if (b.currentPeriodEnd && b.currentPeriodEnd > now) return true; // cancelou mas o mês já pago não acabou
  return b.trialEndsAt > now;
}

export function trialDaysLeft(b: BillingState, now = new Date()): number {
  return Math.max(0, Math.ceil((b.trialEndsAt.getTime() - now.getTime()) / 86_400_000));
}

export function billingConfigured(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

const MP_API = "https://api.mercadopago.com";

async function mp<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${MP_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Mercado Pago ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export type Preapproval = {
  id: string;
  status: "pending" | "authorized" | "paused" | "cancelled";
  external_reference: string;
  init_point: string;
  next_payment_date?: string;
};

/** Cria a assinatura mensal no Mercado Pago e devolve o link do checkout. */
export async function createSubscription(opts: {
  businessId: string;
  payerEmail: string;
  backUrl: string;
}): Promise<Preapproval> {
  return mp<Preapproval>("/preapproval", {
    method: "POST",
    body: JSON.stringify({
      reason: PLAN_NAME,
      external_reference: opts.businessId,
      payer_email: opts.payerEmail,
      back_url: opts.backUrl,
      status: "pending",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: PLAN_PRICE,
        currency_id: "BRL",
      },
    }),
  });
}

export function getSubscription(id: string): Promise<Preapproval> {
  return mp<Preapproval>(`/preapproval/${encodeURIComponent(id)}`);
}

export function cancelSubscription(id: string): Promise<Preapproval> {
  return mp<Preapproval>(`/preapproval/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ status: "cancelled" }),
  });
}

export function mapStatus(status: Preapproval["status"]): string {
  switch (status) {
    case "authorized":
      return "active";
    case "paused":
      return "past_due";
    case "cancelled":
      return "canceled";
    default:
      return "pending";
  }
}

/**
 * Valida o cabeçalho x-signature do webhook do Mercado Pago.
 * Formato: "ts=1700000000,v1=<hmac>" sobre "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
 */
export function verifyWebhookSignature(opts: {
  signature: string | null;
  requestId: string | null;
  dataId: string;
  secret: string;
}): boolean {
  if (!opts.signature) return false;
  const parts = Object.fromEntries(
    opts.signature.split(",").map((p) => p.trim().split("=") as [string, string]),
  );
  if (!parts.ts || !parts.v1) return false;
  let manifest = `id:${opts.dataId.toLowerCase()};`;
  if (opts.requestId) manifest += `request-id:${opts.requestId};`;
  manifest += `ts:${parts.ts};`;
  const expected = createHmac("sha256", opts.secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

type AuthorizedPayment = { id: number; preapproval_id: string; status: string };

export function getAuthorizedPayment(id: string): Promise<AuthorizedPayment> {
  return mp<AuthorizedPayment>(`/authorized_payments/${encodeURIComponent(id)}`);
}
