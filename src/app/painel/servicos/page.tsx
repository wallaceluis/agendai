import { ActionForm } from "@/components/ActionForm";
import { SubmitButton } from "@/components/SubmitButton";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDuration, formatPrice } from "@/lib/format";
import { deleteService, saveService, toggleService } from "../actions";

function ServiceFields({ s }: { s?: { name: string; description: string | null; durationMin: number; priceCents: number } }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
      <div>
        <label className="label">Nome</label>
        <input className="input" name="name" defaultValue={s?.name} placeholder="Ex: Corte feminino" required />
      </div>
      <div>
        <label className="label">Duração (min)</label>
        <input className="input" name="durationMin" type="number" min={5} step={5} defaultValue={s?.durationMin ?? 30} required />
      </div>
      <div>
        <label className="label">Preço (R$)</label>
        <input className="input" name="price" inputMode="decimal" defaultValue={s ? (s.priceCents / 100).toFixed(2).replace(".", ",") : ""} placeholder="50,00" required />
      </div>
      <div className="sm:col-span-3">
        <label className="label">Descrição (opcional)</label>
        <input className="input" name="description" defaultValue={s?.description ?? ""} maxLength={140} placeholder="Ex: Inclui lavagem e finalização" />
      </div>
    </div>
  );
}

export default async function ServicesPage() {
  const business = await requireBusiness();
  const services = await prisma.service.findMany({
    where: { businessId: business.id },
    orderBy: [{ active: "desc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Serviços</h1>
        <p className="text-sm text-stone-500">O que aparece na sua página de agendamento, com duração e preço.</p>
      </div>

      <ActionForm action={saveService} className="card space-y-3" resetOnSuccess>
        <h2 className="font-semibold">Novo serviço</h2>
        <ServiceFields />
        <SubmitButton>Adicionar serviço</SubmitButton>
      </ActionForm>

      <ul className="space-y-3">
        {services.map((s) => (
          <li key={s.id} className={`card ${s.active ? "" : "opacity-60"}`}>
            <details>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <span>
                  <span className="font-semibold">{s.name}</span>
                  {!s.active && <span className="badge ml-2 bg-stone-200 text-stone-600">Oculto</span>}
                  <span className="block text-sm text-stone-500">
                    {formatDuration(s.durationMin)} · {formatPrice(s.priceCents)}
                  </span>
                </span>
                <span className="text-sm font-medium text-brand-700">Editar</span>
              </summary>
              <div className="mt-4 border-t border-stone-100 pt-4">
                <ActionForm action={saveService} className="space-y-3">
                  <input type="hidden" name="id" value={s.id} />
                  <ServiceFields s={s} />
                  <SubmitButton>Salvar</SubmitButton>
                </ActionForm>
                <div className="mt-3 flex gap-2">
                  <form action={toggleService.bind(null, s.id)}>
                    <button className="btn-secondary px-3 py-1.5 text-xs">{s.active ? "Ocultar da página" : "Mostrar na página"}</button>
                  </form>
                  <form action={deleteService.bind(null, s.id)}>
                    <button className="btn-danger px-3 py-1.5 text-xs">Excluir</button>
                  </form>
                </div>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
