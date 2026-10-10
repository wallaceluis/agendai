import "server-only";
import { computeSlots, dayRangeUtc, type Slot } from "./availability";
import { prisma } from "./db";

export const ACTIVE_STATUSES = ["pending", "confirmed", "completed"];

export const STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  completed: "Atendido",
  canceled: "Cancelado",
  no_show: "Faltou",
};

type BusinessForSlots = {
  id: string;
  slotInterval: number;
  minNoticeMinutes: number;
};

export async function loadSlots(opts: {
  business: BusinessForSlots;
  durationMin: number;
  date: string;
  professionalId?: string | null;
}): Promise<Slot[]> {
  const { business, date } = opts;
  const range = dayRangeUtc(date);
  const [hours, professionals, busy] = await Promise.all([
    prisma.workingHour.findMany({ where: { businessId: business.id } }),
    prisma.professional.findMany({ where: { businessId: business.id, active: true }, select: { id: true } }),
    prisma.booking.findMany({
      where: {
        businessId: business.id,
        status: { in: ACTIVE_STATUSES },
        startsAt: { lt: range.lt },
        endsAt: { gt: range.gte },
      },
      select: { professionalId: true, startsAt: true, endsAt: true },
    }),
  ]);

  return computeSlots({
    date,
    durationMin: opts.durationMin,
    slotInterval: business.slotInterval,
    minNoticeMinutes: business.minNoticeMinutes,
    hours,
    professionalIds: professionals.map((p) => p.id),
    wantedProfessionalId: opts.professionalId || null,
    busy,
  });
}
