// Os horários são guardados em UTC e exibidos no fuso do estabelecimento.
// O Brasil não tem horário de verão desde 2019, então um deslocamento fixo resolve.
export const TZ_OFFSET_MINUTES = Number(process.env.TZ_OFFSET_MINUTES ?? -180);

const MINUTE = 60_000;

/** "2026-10-10" + 570 (09:30 local) -> Date em UTC */
export function localToUtc(date: string, minutes: number): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + (minutes - TZ_OFFSET_MINUTES) * MINUTE);
}

/** Date UTC -> partes no horário local */
export function utcToLocal(date: Date) {
  const shifted = new Date(date.getTime() + TZ_OFFSET_MINUTES * MINUTE);
  return {
    date: shifted.toISOString().slice(0, 10),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay(),
  };
}

export function todayLocal(now = new Date()): string {
  return utcToLocal(now).date;
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function minutesToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function hhmmToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 24 || m > 59) return null;
  return h * 60 + m;
}

export function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2026-10-10" -> "Sáb, 10 out" */
export function formatDateShort(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${WEEKDAYS_SHORT[weekdayOf(date)]}, ${d} ${MONTHS_SHORT[m - 1]}`;
}

/** "2026-10-10" -> "sábado, 10/10/2026" */
export function formatDateLong(date: string): string {
  const [y, m, d] = date.split("-");
  return `${WEEKDAYS[weekdayOf(date)].toLowerCase()}, ${d}/${m}/${y}`;
}
