import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/billing";
import { loadSlots } from "@/lib/booking";
import { prisma } from "@/lib/db";
import { addDays, isValidDate, minutesToHHMM, todayLocal } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const url = new URL(req.url);
  const serviceId = url.searchParams.get("serviceId") ?? "";
  const professionalId = url.searchParams.get("professionalId") || null;
  const date = url.searchParams.get("date") ?? "";

  const business = await prisma.business.findUnique({ where: { slug: params.slug } });
  if (!business || !hasAccess(business)) {
    return NextResponse.json({ error: "Agenda indisponível" }, { status: 404 });
  }
  const today = todayLocal();
  if (!isValidDate(date) || date < today || date > addDays(today, business.maxDaysAhead)) {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 });
  }
  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId: business.id, active: true },
  });
  if (!service) return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });

  const slots = await loadSlots({ business, durationMin: service.durationMin, date, professionalId });
  return NextResponse.json({
    slots: slots.map((s) => ({ time: minutesToHHMM(s.minutes), minutes: s.minutes })),
  });
}
