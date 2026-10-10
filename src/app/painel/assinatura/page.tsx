import { ActionForm } from "@/components/ActionForm";
import { SubmitButton } from "@/components/SubmitButton";
import { requireBusiness } from "@/lib/auth";
import { billingConfigured, hasAccess, PLAN_NAME, PLAN_PRICE, trialDaysLeft } from "@/lib/billing";
import { syncSubscription } from "@/lib/subscription-sync";
import { cancelPlan, startCheckout } from "../actions";

const STATUS: Record<string, string> = {
  trialing: "Teste grátis",
  active: "Ativa",
  pending: "Aguardando pagamento",
  past_due: "Pagamento pendente",
  canceled: "Cancelada",
};

export default async function SubscriptionPage({ searchParams }: { searchParams: { retorno?: string } }) {
  let business = await requireBusiness();
  // Na volta do checkout, confere o status direto no Mercado Pago sem esperar o webhook.
  if (searchParams.retorno && business.subscriptionId && billingConfigured()) {
    const synced = await syncSubscription(business.subscriptionId).catch(() => null);
    if (synced) business = { ...business, ...synced };
  }
  const price = PLAN_PRICE.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const access = hasAccess(business);
  const configured = billingConfigured();
  const isActive = business.subscriptionStatus === "active";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Assinatura</h1>

      {searchParams.retorno && !isActive && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Recebemos seu retorno do Mercado Pago. Assim que o pagamento for aprovado, sua assinatura aparece como ativa aqui.
        </div>
      )}

      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-stone-500">Plano</p>
            <p className="text-lg font-bold">{PLAN_NAME}</p>
          </div>
          <span className={`badge ${access ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {STATUS[business.subscriptionStatus] ?? business.subscriptionStatus}
          </span>
        </div>
        <p className="mt-4 text-3xl font-extrabold">{price}<span className="text-base font-medium text-stone-500">/mês</span></p>

        <div className="mt-4 text-sm text-stone-600">
          {business.subscriptionStatus === "trialing" &&
            (access
              ? `Seu teste grátis termina em ${trialDaysLeft(business)} dia(s), em ${business.trialEndsAt.toLocaleDateString("pt-BR")}.`
              : "Seu teste grátis terminou. Assine para reativar sua página de agendamento.")}
          {isActive && business.currentPeriodEnd && `Próxima cobrança em ${business.currentPeriodEnd.toLocaleDateString("pt-BR")}.`}
          {business.subscriptionStatus === "canceled" && business.currentPeriodEnd &&
            `Sua agenda fica no ar até ${business.currentPeriodEnd.toLocaleDateString("pt-BR")}.`}
          {business.subscriptionStatus === "past_due" && "Não conseguimos cobrar seu cartão. Atualize o pagamento no Mercado Pago."}
        </div>

        {!isActive && (
          <ActionForm action={startCheckout} className="mt-6">
            <SubmitButton className="btn-primary w-full py-3 text-base" pendingText="Abrindo Mercado Pago...">
              Assinar por {price}/mês
            </SubmitButton>
            <p className="mt-2 text-center text-xs text-stone-500">Pagamento recorrente no cartão pelo Mercado Pago. Cancele quando quiser.</p>
            {!configured && (
              <p className="mt-2 text-center text-xs text-amber-700">Modo de configuração: defina MP_ACCESS_TOKEN para ativar o checkout.</p>
            )}
          </ActionForm>
        )}

        {isActive && (
          <ActionForm action={cancelPlan} className="mt-6">
            <SubmitButton className="btn-danger w-full" pendingText="Cancelando...">Cancelar assinatura</SubmitButton>
          </ActionForm>
        )}
      </div>
    </div>
  );
}
