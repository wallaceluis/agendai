import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { SubmitButton } from "@/components/SubmitButton";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDuration, formatPrice } from "@/lib/format";
import { isValidDate, todayLocal } from "@/lib/time";
import { createManualBooking } from "../../actions";

export default async function NewBookingPage({ searchParams }: { searchParams: { data?: string } }) {
  const business = await requireBusiness();
  const [services, professionals] = await Promise.all([
    prisma.service.findMany({ where: { businessId: business.id, active: true }, orderBy: { createdAt: "asc" } }),
    prisma.professional.findMany({ where: { businessId: business.id, active: true }, orderBy: { createdAt: "asc" } }),
  ]);
  const date = searchParams.data && isValidDate(searchParams.data) ? searchParams.data : todayLocal();

  return (
    <div className="mx-auto max-w-lg">
      <Link href={`/painel?data=${date}`} className="text-sm text-stone-500 hover:underline">← Voltar para a agenda</Link>
      <h1 className="mt-2 text-2xl font-bold">Novo agendamento</h1>
      <p className="text-sm text-stone-500">Para clientes que ligaram, mandaram mensagem ou chegaram no balcão.</p>

      <ActionForm action={createManualBooking} className="card mt-4 space-y-4">
        <div>
          <label className="label" htmlFor="customerName">Cliente</label>
          <input className="input" id="customerName" name="customerName" required />
        </div>
        <div>
          <label className="label" htmlFor="customerPhone">WhatsApp (opcional)</label>
          <input className="input" id="customerPhone" name="customerPhone" inputMode="tel" placeholder="(11) 99999-8888" />
        </div>
        <div>
          <label className="label" htmlFor="serviceId">Serviço</label>
          <select className="input" id="serviceId" name="serviceId" required>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {formatDuration(s.durationMin)} · {formatPrice(s.priceCents)}
              </option>
            ))}
          </select>
        </div>
        {professionals.length > 0 && (
          <div>
            <label className="label" htmlFor="professionalId">Profissional</label>
            <select className="input" id="professionalId" name="professionalId" required>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="date">Data</label>
            <input className="input" id="date" name="date" type="date" defaultValue={date} required />
          </div>
          <div>
            <label className="label" htmlFor="time">Horário</label>
            <input className="input" id="time" name="time" type="time" step={300} required />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="notes">Observação</label>
          <input className="input" id="notes" name="notes" />
        </div>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" name="force" className="h-4 w-4 accent-brand-600" /> Agendar mesmo se houver conflito (encaixe)
        </label>
        <SubmitButton className="btn-primary w-full">Salvar agendamento</SubmitButton>
      </ActionForm>
    </div>
  );
}
