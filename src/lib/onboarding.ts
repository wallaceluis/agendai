import type { Prisma } from "@prisma/client";

// Terça a sábado, 9h às 19h com almoço das 12h às 13h. O dono ajusta depois.
export const DEFAULT_HOURS = [2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  openMin: 9 * 60,
  closeMin: 19 * 60,
  breakStart: 12 * 60,
  breakEnd: 13 * 60,
}));

export const DEFAULT_SERVICES: Omit<Prisma.ServiceCreateManyBusinessInput, "id">[] = [
  { name: "Corte", durationMin: 45, priceCents: 5000 },
  { name: "Escova", durationMin: 40, priceCents: 4500 },
  { name: "Manicure", durationMin: 45, priceCents: 3500 },
  { name: "Barba", durationMin: 30, priceCents: 3000 },
];
