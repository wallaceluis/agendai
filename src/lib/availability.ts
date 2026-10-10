import { addDays, localToUtc, utcToLocal, weekdayOf } from "./time";

export type Hours = {
  weekday: number;
  openMin: number;
  closeMin: number;
  breakStart: number | null;
  breakEnd: number | null;
};

export type BusyBlock = { professionalId: string | null; startsAt: Date; endsAt: Date };

export type SlotInput = {
  date: string; // AAAA-MM-DD no horário local
  durationMin: number;
  slotInterval: number;
  minNoticeMinutes: number;
  hours: Hours[];
  professionalIds: string[]; // profissionais ativos; vazio = estabelecimento atende um por vez
  wantedProfessionalId?: string | null; // null/undefined = qualquer um
  busy: BusyBlock[];
  now?: Date;
};

export type Slot = { minutes: number; startsAt: Date; professionalId: string | null };

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  aStart < bEnd && bStart < aEnd;

/** Calcula os horários livres de um dia para um serviço. */
export function computeSlots(input: SlotInput): Slot[] {
  const { date, durationMin, slotInterval, hours, busy } = input;
  const now = input.now ?? new Date();
  const day = hours.find((h) => h.weekday === weekdayOf(date));
  if (!day || day.closeMin <= day.openMin || durationMin <= 0) return [];

  const resources: (string | null)[] = input.wantedProfessionalId
    ? input.professionalIds.includes(input.wantedProfessionalId)
      ? [input.wantedProfessionalId]
      : []
    : input.professionalIds.length > 0
      ? input.professionalIds
      : [null];

  const earliest = now.getTime() + input.minNoticeMinutes * 60_000;
  const step = Math.max(5, slotInterval);
  const slots: Slot[] = [];

  for (let start = day.openMin; start + durationMin <= day.closeMin; start += step) {
    const end = start + durationMin;
    if (
      day.breakStart != null &&
      day.breakEnd != null &&
      overlaps(start, end, day.breakStart, day.breakEnd)
    ) {
      continue;
    }
    const startsAt = localToUtc(date, start);
    if (startsAt.getTime() < earliest) continue;
    const endsAt = new Date(startsAt.getTime() + durationMin * 60_000);

    const free = resources.find((resource) =>
      !busy.some(
        (b) =>
          // Sem profissionais cadastrados, qualquer agendamento ocupa o horário.
          (resource === null || b.professionalId === resource || b.professionalId === null) &&
          overlaps(startsAt.getTime(), endsAt.getTime(), b.startsAt.getTime(), b.endsAt.getTime()),
      ),
    );
    if (free !== undefined) slots.push({ minutes: start, startsAt, professionalId: free });
  }
  return slots;
}

/** Datas (AAAA-MM-DD) que o estabelecimento abre, a partir de hoje. */
export function openDates(today: string, maxDaysAhead: number, hours: Hours[]): string[] {
  const open = new Set(hours.filter((h) => h.closeMin > h.openMin).map((h) => h.weekday));
  const dates: string[] = [];
  for (let i = 0; i <= maxDaysAhead; i++) {
    const date = addDays(today, i);
    if (open.has(weekdayOf(date))) dates.push(date);
  }
  return dates;
}

export function dayRangeUtc(date: string) {
  return { gte: localToUtc(date, 0), lt: localToUtc(addDays(date, 1), 0) };
}

export { utcToLocal };
