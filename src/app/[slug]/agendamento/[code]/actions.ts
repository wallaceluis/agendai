"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function cancelByCustomer(code: string) {
  const booking = await prisma.booking.findUnique({
    where: { code },
    include: { business: { select: { slug: true } } },
  });
  if (!booking || !["pending", "confirmed"].includes(booking.status) || booking.startsAt < new Date()) return;
  await prisma.booking.update({ where: { id: booking.id }, data: { status: "canceled" } });
  revalidatePath(`/${booking.business.slug}/agendamento/${code}`);
}
