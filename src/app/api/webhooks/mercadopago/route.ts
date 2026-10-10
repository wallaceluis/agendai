import { NextResponse } from "next/server";
import { getAuthorizedPayment, verifyWebhookSignature } from "@/lib/billing";
import { syncSubscription } from "@/lib/subscription-sync";

export const dynamic = "force-dynamic";

// Configure no painel do Mercado Pago (Suas integrações > Webhooks) os eventos
// "Planos e assinaturas" apontando para https://SEU_DOMINIO/api/webhooks/mercadopago
export async function POST(req: Request) {
  const url = new URL(req.url);
  const body = (await req.json().catch(() => ({}))) as { type?: string; data?: { id?: string | number } };
  const type = body.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic") ?? "";
  const dataId = String(body.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");
  if (!dataId) return NextResponse.json({ ok: true });

  const secret = process.env.MP_WEBHOOK_SECRET;
  if (secret) {
    const valid = verifyWebhookSignature({
      signature: req.headers.get("x-signature"),
      requestId: req.headers.get("x-request-id"),
      dataId,
      secret,
    });
    if (!valid) return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }

  try {
    if (type === "subscription_preapproval" || type === "preapproval") {
      await syncSubscription(dataId);
    } else if (type === "subscription_authorized_payment") {
      const payment = await getAuthorizedPayment(dataId);
      if (payment.preapproval_id) await syncSubscription(payment.preapproval_id);
    }
  } catch (e) {
    console.error("webhook mercadopago", e);
    return NextResponse.json({ error: "falha ao processar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
