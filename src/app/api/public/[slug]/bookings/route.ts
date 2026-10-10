import { NextResponse } from "next/server";
import { z } from "zod";
import { hasAccess } from "@/lib/billing";
import { loadSlots } from "@/lib/booking";
import { bookingCode } from "@/lib/codes";
import { prisma } from "@/lib/db";
import { isValidPhone, normalizePhone } from "@/lib/format";
import { addDays, isValidDate, todayLocal } from "@/lib/time";

const schema = z.object({
  serviceId: z.string().min(1),
  professionalId: z.string().nullish(),
  date: z.string().refine(isValidDate),
  minutes: z.number().int().min(0).max(24 * 60),
  customerName: z.string().trim().min(2, "Informe seu nome").max(80),
  customerPhone: z.string().refine(isValidPhone, "WhatsApp inválido. Use DDD + número"),
  notes: z.string().trim().max(300).optional(),
});

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }
  const data = parsed.data;

  const business = await prisma.business.findUnique({ where: { slug: params.slug } });
  if (!business || !hasAccess(business)) {
    return NextResponse.json({ error: "Agenda indisponível" }, { status: 404 });
  }
  const today = todayLocal();
  if (data.date < today || data.date > addDays(today, business.maxDaysAhead)) {
    return NextResponse.json({ error: "Data fora do período de agendamento" }, { status: 400 });
  }
  const service = await prisma.service.findFirst({
    where: { id: data.serviceId, businessId: business.id, active: true },
  });
  if (!service) return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });

  // Recalcula os horários livres na hora de gravar para não marcar em cima de outro cliente.
  const slots = await loadSlots({
    business,
    durationMin: service.durationMin,
    date: data.date,
    professionalId: data.professionalId,
  });
  const slot = slots.find((s) => s.minutes === data.minutes);
  if (!slot) {
    return NextResponse.json(
      { error: "Esse horário acabou de ser ocupado. Escolha outro, por favor." },
      { status: 409 },
    );
  }

  const booking = await prisma.booking.create({
    data: {
      code: bookingCode(),
      businessId: business.id,
      serviceId: service.id,
      professionalId: slot.professionalId,
      customerName: data.customerName,
      customerPhone: normalizePhone(data.customerPhone),
      notes: data.notes || null,
      startsAt: slot.startsAt,
      endsAt: new Date(slot.startsAt.getTime() + service.durationMin * 60_000),
      priceCents: service.priceCents,
    },
  });

  return NextResponse.json({ code: booking.code }, { status: 201 });
}
