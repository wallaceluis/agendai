import { describe, expect, it } from "vitest";
import { computeSlots, openDates, type Hours } from "./availability";
import { localToUtc } from "./time";

// 2026-10-13 é uma terça-feira
const DATE = "2026-10-13";
const hours: Hours[] = [{ weekday: 2, openMin: 540, closeMin: 720, breakStart: 600, breakEnd: 630 }];
const base = {
  date: DATE,
  durationMin: 30,
  slotInterval: 30,
  minNoticeMinutes: 0,
  hours,
  professionalIds: [] as string[],
  busy: [],
  now: new Date("2026-10-01T00:00:00Z"),
};
const times = (slots: { minutes: number }[]) => slots.map((s) => s.minutes);

describe("computeSlots", () => {
  it("gera horários dentro do expediente e pula o intervalo", () => {
    expect(times(computeSlots(base))).toEqual([540, 570, 630, 660, 690]);
  });

  it("não deixa o serviço atravessar o intervalo nem o fechamento", () => {
    expect(times(computeSlots({ ...base, durationMin: 60 }))).toEqual([540, 630, 660]);
  });

  it("retorna vazio em dia fechado", () => {
    expect(computeSlots({ ...base, date: "2026-10-12" })).toEqual([]);
  });

  it("bloqueia horários ocupados quando não há profissionais", () => {
    const busy = [{ professionalId: null, startsAt: localToUtc(DATE, 540), endsAt: localToUtc(DATE, 600) }];
    expect(times(computeSlots({ ...base, busy }))).toEqual([630, 660, 690]);
  });

  it("com dois profissionais, um ocupado não bloqueia o horário", () => {
    const busy = [{ professionalId: "a", startsAt: localToUtc(DATE, 540), endsAt: localToUtc(DATE, 570) }];
    const slots = computeSlots({ ...base, professionalIds: ["a", "b"], busy });
    expect(slots[0]).toMatchObject({ minutes: 540, professionalId: "b" });
  });

  it("respeita o profissional escolhido", () => {
    const busy = [{ professionalId: "a", startsAt: localToUtc(DATE, 540), endsAt: localToUtc(DATE, 570) }];
    const slots = computeSlots({ ...base, professionalIds: ["a", "b"], wantedProfessionalId: "a", busy });
    expect(times(slots)).toEqual([570, 630, 660, 690]);
  });

  it("respeita a antecedência mínima", () => {
    const now = localToUtc(DATE, 560);
    expect(times(computeSlots({ ...base, now, minNoticeMinutes: 60 }))).toEqual([630, 660, 690]);
  });
});

describe("openDates", () => {
  it("lista só os dias que abrem", () => {
    expect(openDates("2026-10-12", 8, hours)).toEqual(["2026-10-13", "2026-10-20"]);
  });
});

describe("localToUtc", () => {
  it("converte horário de Brasília para UTC", () => {
    expect(localToUtc(DATE, 540).toISOString()).toBe("2026-10-13T12:00:00.000Z");
  });
});
