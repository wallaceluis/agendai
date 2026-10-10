import "server-only";
import { getSubscription, mapStatus } from "./billing";
import { prisma } from "./db";

/** Busca a assinatura no Mercado Pago e grava o status no estabelecimento. */
export async function syncSubscription(preapprovalId: string) {
  const sub = await getSubscription(preapprovalId);
  const business = await prisma.business.findFirst({
    where: { OR: [{ id: sub.external_reference }, { subscriptionId: sub.id }] },
  });
  if (!business) return null;

  const status = mapStatus(sub.status);
  const nextPayment = sub.next_payment_date ? new Date(sub.next_payment_date) : null;
  return prisma.business.update({
    where: { id: business.id },
    data: {
      subscriptionId: sub.id,
      // "pending" é só checkout aberto; não tira o teste grátis de quem ainda não pagou.
      ...(status !== "pending" ? { subscriptionStatus: status } : {}),
      ...(status === "active" && nextPayment ? { currentPeriodEnd: nextPayment } : {}),
    },
  });
}
