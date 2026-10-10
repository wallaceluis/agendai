import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { openDates } from "@/lib/availability";
import { hasAccess } from "@/lib/billing";
import { prisma } from "@/lib/db";
import { formatPhone } from "@/lib/format";
import { minutesToHHMM, todayLocal, WEEKDAYS } from "@/lib/time";
import { BookingFlow } from "./BookingFlow";

export const dynamic = "force-dynamic";

async function getBusiness(slug: string) {
  return prisma.business.findUnique({
    where: { slug },
    include: {
      services: { where: { active: true }, orderBy: [{ createdAt: "asc" }] },
      professionals: { where: { active: true }, orderBy: { createdAt: "asc" } },
      hours: { orderBy: { weekday: "asc" } },
    },
  });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
    select: { name: true, description: true },
  });
  if (!business) return {};
  return {
    title: `Agende seu horário no ${business.name}`,
    description: business.description ?? `Escolha o serviço e o horário e agende online no ${business.name}.`,
  };
}

export default async function PublicBookingPage({ params }: { params: { slug: string } }) {
  const business = await getBusiness(params.slug);
  if (!business) notFound();

  const style = { "--brand": business.color } as React.CSSProperties;
  const available = hasAccess(business);

  return (
    <div style={style} className="min-h-screen bg-stone-50">
      <header className="text-white" style={{ backgroundColor: business.color }}>
        <div className="mx-auto max-w-2xl px-4 pb-16 pt-10">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/20 text-2xl font-bold">
            {business.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{business.name}</h1>
          {business.description && <p className="mt-1 text-white/85">{business.description}</p>}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/85">
            {business.address && <span>📍 {business.address}</span>}
            <span>📱 {formatPhone(business.phone)}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto -mt-10 max-w-2xl px-4 pb-16">
        {available ? (
          business.services.length > 0 ? (
            <BookingFlow
              slug={business.slug}
              services={business.services.map((s) => ({
                id: s.id,
                name: s.name,
                description: s.description,
                durationMin: s.durationMin,
                priceCents: s.priceCents,
              }))}
              professionals={business.professionals.map((p) => ({ id: p.id, name: p.name }))}
              dates={openDates(todayLocal(), business.maxDaysAhead, business.hours)}
            />
          ) : (
            <div className="card text-center text-stone-600">Ainda não há serviços disponíveis para agendamento.</div>
          )
        ) : (
          <div className="card text-center">
            <p className="font-semibold">A agenda online está temporariamente indisponível.</p>
            <p className="mt-1 text-sm text-stone-600">Fale com o estabelecimento pelo WhatsApp para marcar seu horário.</p>
            <a href={`https://wa.me/${business.phone}`} className="btn-whatsapp mt-4">
              Chamar no WhatsApp
            </a>
          </div>
        )}

        {business.hours.length > 0 && (
          <section className="card mt-6">
            <h2 className="font-semibold">Horário de funcionamento</h2>
            <ul className="mt-3 divide-y divide-stone-100 text-sm">
              {WEEKDAYS.map((label, weekday) => {
                const h = business.hours.find((x) => x.weekday === weekday);
                return (
                  <li key={label} className="flex justify-between py-1.5">
                    <span className="text-stone-600">{label}</span>
                    <span className="font-medium">
                      {h && h.closeMin > h.openMin
                        ? `${minutesToHHMM(h.openMin)} às ${minutesToHHMM(h.closeMin)}`
                        : "Fechado"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <p className="mt-8 text-center text-xs text-stone-400">
          Agendamento online por{" "}
          <a href="/" className="font-semibold text-stone-500 hover:underline">Agendaí</a>
        </p>
      </main>
    </div>
  );
}
