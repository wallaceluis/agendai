import { notFound } from "next/navigation";
import { appUrl } from "@/lib/app-url";
import { STATUS_LABELS } from "@/lib/booking";
import { prisma } from "@/lib/db";
import { formatDuration, formatPrice } from "@/lib/format";
import { formatDateLong, minutesToHHMM, utcToLocal } from "@/lib/time";
import { customerConfirmMessage, waLink } from "@/lib/whatsapp";
import { SubmitButton } from "@/components/SubmitButton";
import { cancelByCustomer } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seu agendamento", robots: { index: false } };

function googleCalendarUrl(title: string, start: Date, end: Date, location?: string | null) {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
  });
  if (location) params.set("location", location);
  return `https://calendar.google.com/calendar/render?${params}`;
}

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: { slug: string; code: string };
  searchParams: { novo?: string };
}) {
  const booking = await prisma.booking.findUnique({
    where: { code: params.code },
    include: { business: true, service: true, professional: true },
  });
  if (!booking || booking.business.slug !== params.slug) notFound();

  const { business } = booking;
  const local = utcToLocal(booking.startsAt);
  const dateLabel = formatDateLong(local.date);
  const timeLabel = minutesToHHMM(local.minutes);
  const manageUrl = appUrl(`/${business.slug}/agendamento/${booking.code}`);
  const active = ["pending", "confirmed"].includes(booking.status);
  const canCancel = active && booking.startsAt > new Date();
  const message = customerConfirmMessage(
    {
      businessName: business.name,
      serviceName: booking.service.name,
      professionalName: booking.professional?.name,
      dateLabel,
      timeLabel,
      priceCents: booking.priceCents,
      customerName: booking.customerName,
      code: booking.code,
    },
    manageUrl,
  );
  const cancel = cancelByCustomer.bind(null, booking.code);

  return (
    <div style={{ "--brand": business.color } as React.CSSProperties} className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-md">
        {searchParams.novo && active && (
          <div className="mb-4 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-100 text-2xl">✓</div>
            <h1 className="mt-3 text-2xl font-bold">Horário reservado!</h1>
            <p className="mt-1 text-sm text-stone-600">
              Falta só um passo: avise o {business.name} pelo WhatsApp para confirmar.
            </p>
          </div>
        )}

        <div className="card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-stone-500">{business.name}</p>
              <p className="text-xl font-bold">{booking.service.name}</p>
            </div>
            <span
              className={`badge ${
                booking.status === "confirmed"
                  ? "bg-green-100 text-green-700"
                  : booking.status === "canceled"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {STATUS_LABELS[booking.status]}
            </span>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-stone-500">Data</dt><dd className="font-medium">{dateLabel}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-500">Horário</dt><dd className="font-medium">{timeLabel} ({formatDuration(booking.service.durationMin)})</dd></div>
            {booking.professional && (
              <div className="flex justify-between"><dt className="text-stone-500">Profissional</dt><dd className="font-medium">{booking.professional.name}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-stone-500">Valor</dt><dd className="font-medium">{formatPrice(booking.priceCents)}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-500">Código</dt><dd className="font-mono font-medium">{booking.code}</dd></div>
            {business.address && (
              <div className="flex justify-between gap-4"><dt className="text-stone-500">Endereço</dt><dd className="text-right font-medium">{business.address}</dd></div>
            )}
          </dl>

          {active && (
            <div className="mt-6 space-y-2">
              <a href={waLink(business.phone, message)} target="_blank" rel="noopener noreferrer" className="btn-whatsapp w-full py-3 text-base">
                Confirmar pelo WhatsApp
              </a>
              <a
                href={googleCalendarUrl(`${booking.service.name} - ${business.name}`, booking.startsAt, booking.endsAt, business.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary w-full"
              >
                Adicionar à minha agenda
              </a>
            </div>
          )}
        </div>

        {canCancel && (
          <form action={cancel} className="mt-4 text-center">
            <SubmitButton className="text-sm font-medium text-stone-500 underline hover:text-red-600" pendingText="Cancelando...">
              Preciso cancelar este horário
            </SubmitButton>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <a href={`/${business.slug}`} className="font-medium text-stone-600 hover:underline">← Fazer outro agendamento</a>
        </p>
      </div>
    </div>
  );
}
