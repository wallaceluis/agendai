import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { appUrl } from "@/lib/app-url";
import { dayRangeUtc } from "@/lib/availability";
import { requireBusiness } from "@/lib/auth";
import { ACTIVE_STATUSES, STATUS_LABELS } from "@/lib/booking";
import { prisma } from "@/lib/db";
import { formatPhone, formatPrice } from "@/lib/format";
import { addDays, formatDateLong, isValidDate, minutesToHHMM, todayLocal, utcToLocal } from "@/lib/time";
import { ownerReminderMessage, waLink } from "@/lib/whatsapp";
import { setBookingStatus } from "./actions";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-sky-100 text-sky-800",
  canceled: "bg-stone-200 text-stone-600",
  no_show: "bg-red-100 text-red-700",
};

function StatusButton({ id, status, label, className = "btn-secondary" }: { id: string; status: string; label: string; className?: string }) {
  return (
    <form action={setBookingStatus.bind(null, id, status)}>
      <button className={`${className} px-3 py-1.5 text-xs`}>{label}</button>
    </form>
  );
}

export default async function AgendaPage({ searchParams }: { searchParams: { data?: string; bemvindo?: string } }) {
  const business = await requireBusiness();
  const today = todayLocal();
  const date = searchParams.data && isValidDate(searchParams.data) ? searchParams.data : today;
  const range = dayRangeUtc(date);
  const publicUrl = appUrl(`/${business.slug}`);

  const [bookings, pendingCount, serviceCount] = await Promise.all([
    prisma.booking.findMany({
      where: { businessId: business.id, startsAt: range },
      include: { service: true, professional: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.booking.count({
      where: { businessId: business.id, status: "pending", startsAt: { gte: new Date() } },
    }),
    prisma.service.count({ where: { businessId: business.id, active: true } }),
  ]);

  const active = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status));
  const revenue = active.reduce((sum, b) => sum + b.priceCents, 0);

  return (
    <div className="space-y-6">
      {searchParams.bemvindo && (
        <div className="card border-brand-200 bg-brand-50">
          <h2 className="text-lg font-bold">Sua agenda está no ar! 🎉</h2>
          <p className="mt-1 text-sm text-stone-700">
            Já criamos horários (terça a sábado, 9h às 19h) e {serviceCount} serviços de exemplo. Ajuste em{" "}
            <Link href="/painel/servicos" className="font-semibold underline">Serviços</Link> e{" "}
            <Link href="/painel/horarios" className="font-semibold underline">Horários</Link>, depois divulgue seu link:
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="rounded-lg bg-white px-3 py-2 text-sm">{publicUrl}</code>
            <CopyButton text={publicUrl} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-sm capitalize text-stone-500">{formatDateLong(date)}{date === today && " (hoje)"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/painel?data=${addDays(date, -1)}`} className="btn-secondary px-3" aria-label="Dia anterior">←</Link>
          {date !== today && <Link href="/painel" className="btn-secondary">Hoje</Link>}
          <form action="/painel" className="hidden sm:contents">
            <input type="date" name="data" defaultValue={date} className="input w-auto py-2" />
            <button className="btn-secondary">Ir</button>
          </form>
          <Link href={`/painel?data=${addDays(date, 1)}`} className="btn-secondary px-3" aria-label="Próximo dia">→</Link>
          <Link href={`/painel/agendamentos/novo?data=${date}`} className="btn-primary">+ Agendar</Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="card p-3 sm:p-5">
          <p className="text-xs text-stone-500 sm:text-sm">Atendimentos</p>
          <p className="mt-1 text-lg font-bold sm:text-2xl">{active.length}</p>
        </div>
        <div className="card p-3 sm:p-5">
          <p className="text-xs text-stone-500 sm:text-sm">Previsto no dia</p>
          <p className="mt-1 text-lg font-bold sm:text-2xl">{formatPrice(revenue)}</p>
        </div>
        <div className="card p-3 sm:p-5">
          <p className="text-xs text-stone-500 sm:text-sm">A confirmar</p>
          <p className="mt-1 text-lg font-bold sm:text-2xl">{pendingCount}</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="font-medium">Nenhum agendamento neste dia.</p>
          <p className="mt-1 text-sm text-stone-500">Compartilhe seu link para os clientes marcarem sozinhos.</p>
          <div className="mt-4 flex justify-center">
            <CopyButton text={publicUrl} label="Copiar link de agendamento" />
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => {
            const local = utcToLocal(b.startsAt);
            const end = utcToLocal(b.endsAt);
            const manageUrl = appUrl(`/${business.slug}/agendamento/${b.code}`);
            const reminder = ownerReminderMessage(
              {
                businessName: business.name,
                serviceName: b.service.name,
                professionalName: b.professional?.name,
                dateLabel: formatDateLong(local.date),
                timeLabel: minutesToHHMM(local.minutes),
                priceCents: b.priceCents,
                customerName: b.customerName,
                code: b.code,
              },
              manageUrl,
            );
            const muted = b.status === "canceled" || b.status === "no_show";
            return (
              <li key={b.id} className={`card flex flex-col gap-3 sm:flex-row sm:items-center ${muted ? "opacity-60" : ""}`}>
                <div className="w-24 shrink-0">
                  <p className="text-lg font-bold">{minutesToHHMM(local.minutes)}</p>
                  <p className="text-xs text-stone-500">até {minutesToHHMM(end.minutes)}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{b.customerName}</p>
                    <span className={`badge ${STATUS_STYLES[b.status]}`}>{STATUS_LABELS[b.status]}</span>
                    {b.source === "manual" && <span className="badge bg-stone-100 text-stone-600">Manual</span>}
                  </div>
                  <p className="text-sm text-stone-600">
                    {b.service.name} · {formatPrice(b.priceCents)}
                    {b.professional && ` · ${b.professional.name}`}
                  </p>
                  {b.customerPhone && <p className="text-xs text-stone-500">{formatPhone(b.customerPhone)}</p>}
                  {b.notes && <p className="mt-1 text-xs italic text-stone-500">“{b.notes}”</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {b.customerPhone && !muted && (
                    <a href={waLink(b.customerPhone, reminder)} target="_blank" rel="noopener noreferrer" className="btn-whatsapp px-3 py-1.5 text-xs">
                      WhatsApp
                    </a>
                  )}
                  {b.status === "pending" && <StatusButton id={b.id} status="confirmed" label="Confirmar" className="btn-primary" />}
                  {(b.status === "pending" || b.status === "confirmed") && (
                    <>
                      <StatusButton id={b.id} status="completed" label="Atendido" />
                      <StatusButton id={b.id} status="no_show" label="Faltou" />
                      <StatusButton id={b.id} status="canceled" label="Cancelar" className="btn-danger" />
                    </>
                  )}
                  {muted && <StatusButton id={b.id} status="confirmed" label="Reativar" />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
