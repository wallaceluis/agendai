"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireBusiness } from "@/lib/auth";
import { appUrl } from "@/lib/app-url";
import {
  billingConfigured,
  cancelSubscription,
  createSubscription,
} from "@/lib/billing";
import { bookingCode } from "@/lib/codes";
import { prisma } from "@/lib/db";
import { isValidPhone, normalizePhone, parsePriceToCents, RESERVED_SLUGS, slugify } from "@/lib/format";
import { hhmmToMinutes, isValidDate, localToUtc } from "@/lib/time";

export type ActionState = { error?: string; ok?: string };

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

// ---------- Agendamentos ----------

const BOOKING_STATUSES = ["pending", "confirmed", "completed", "canceled", "no_show"];

export async function setBookingStatus(bookingId: string, status: string) {
  const business = await requireBusiness();
  if (!BOOKING_STATUSES.includes(status)) return;
  await prisma.booking.updateMany({ where: { id: bookingId, businessId: business.id }, data: { status } });
  revalidatePath("/painel");
}

export async function createManualBooking(_: ActionState, fd: FormData): Promise<ActionState> {
  const business = await requireBusiness();
  const date = str(fd, "date");
  const minutes = hhmmToMinutes(str(fd, "time"));
  const customerName = str(fd, "customerName");
  const customerPhone = str(fd, "customerPhone");
  if (!isValidDate(date) || minutes === null) return { error: "Informe data e horário válidos" };
  if (customerName.length < 2) return { error: "Informe o nome do cliente" };
  if (customerPhone && !isValidPhone(customerPhone)) return { error: "WhatsApp inválido" };

  const service = await prisma.service.findFirst({ where: { id: str(fd, "serviceId"), businessId: business.id } });
  if (!service) return { error: "Escolha um serviço" };
  const professionalId = str(fd, "professionalId") || null;
  if (professionalId) {
    const pro = await prisma.professional.findFirst({ where: { id: professionalId, businessId: business.id } });
    if (!pro) return { error: "Profissional inválido" };
  }

  const startsAt = localToUtc(date, minutes);
  const endsAt = new Date(startsAt.getTime() + service.durationMin * 60_000);
  const conflict = await prisma.booking.findFirst({
    where: {
      businessId: business.id,
      status: { in: ["pending", "confirmed", "completed"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
      ...(professionalId ? { OR: [{ professionalId }, { professionalId: null }] } : {}),
    },
  });
  if (conflict && fd.get("force") !== "on") {
    return { error: `Conflito com o horário de ${conflict.customerName}. Marque "agendar mesmo assim" para encaixar.` };
  }

  await prisma.booking.create({
    data: {
      code: bookingCode(),
      businessId: business.id,
      serviceId: service.id,
      professionalId,
      customerName,
      customerPhone: customerPhone ? normalizePhone(customerPhone) : "",
      notes: str(fd, "notes") || null,
      startsAt,
      endsAt,
      priceCents: service.priceCents,
      status: "confirmed",
      source: "manual",
    },
  });
  revalidatePath("/painel");
  redirect(`/painel?data=${date}`);
}

// ---------- Serviços ----------

const serviceSchema = z.object({
  name: z.string().trim().min(2, "Nome do serviço muito curto").max(60),
  description: z.string().trim().max(140).optional(),
  durationMin: z.coerce.number().int().min(5, "Duração mínima de 5 minutos").max(600),
  price: z.string(),
});

export async function saveService(_: ActionState, fd: FormData): Promise<ActionState> {
  const business = await requireBusiness();
  const parsed = serviceSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = {
    name: parsed.data.name,
    description: parsed.data.description || null,
    durationMin: parsed.data.durationMin,
    priceCents: parsePriceToCents(parsed.data.price),
  };
  const id = str(fd, "id");
  if (id) {
    await prisma.service.updateMany({ where: { id, businessId: business.id }, data });
  } else {
    await prisma.service.create({ data: { ...data, businessId: business.id } });
  }
  revalidatePath("/painel/servicos");
  return { ok: id ? "Serviço atualizado" : "Serviço criado" };
}

export async function toggleService(id: string) {
  const business = await requireBusiness();
  const service = await prisma.service.findFirst({ where: { id, businessId: business.id } });
  if (!service) return;
  await prisma.service.update({ where: { id }, data: { active: !service.active } });
  revalidatePath("/painel/servicos");
}

export async function deleteService(id: string) {
  const business = await requireBusiness();
  const used = await prisma.booking.count({ where: { serviceId: id } });
  if (used > 0) {
    // Mantém o histórico: só esconde da página pública.
    await prisma.service.updateMany({ where: { id, businessId: business.id }, data: { active: false } });
  } else {
    await prisma.service.deleteMany({ where: { id, businessId: business.id } });
  }
  revalidatePath("/painel/servicos");
}

// ---------- Profissionais ----------

export async function saveProfessional(_: ActionState, fd: FormData): Promise<ActionState> {
  const business = await requireBusiness();
  const name = str(fd, "name");
  if (name.length < 2) return { error: "Informe o nome" };
  const id = str(fd, "id");
  if (id) {
    await prisma.professional.updateMany({ where: { id, businessId: business.id }, data: { name } });
  } else {
    await prisma.professional.create({ data: { name, businessId: business.id } });
  }
  revalidatePath("/painel/profissionais");
  return { ok: "Salvo" };
}

export async function toggleProfessional(id: string) {
  const business = await requireBusiness();
  const pro = await prisma.professional.findFirst({ where: { id, businessId: business.id } });
  if (!pro) return;
  await prisma.professional.update({ where: { id }, data: { active: !pro.active } });
  revalidatePath("/painel/profissionais");
}

export async function deleteProfessional(id: string) {
  const business = await requireBusiness();
  await prisma.professional.deleteMany({ where: { id, businessId: business.id } });
  revalidatePath("/painel/profissionais");
}

// ---------- Horários ----------

export async function saveHours(_: ActionState, fd: FormData): Promise<ActionState> {
  const business = await requireBusiness();
  const rows = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    if (fd.get(`open_${weekday}`) !== "on") continue;
    const openMin = hhmmToMinutes(str(fd, `start_${weekday}`));
    const closeMin = hhmmToMinutes(str(fd, `end_${weekday}`));
    const bs = str(fd, `break_start_${weekday}`);
    const be = str(fd, `break_end_${weekday}`);
    const breakStart = bs ? hhmmToMinutes(bs) : null;
    const breakEnd = be ? hhmmToMinutes(be) : null;
    if (openMin === null || closeMin === null || closeMin <= openMin) {
      return { error: "Confira os horários: o fechamento precisa ser depois da abertura" };
    }
    if ((breakStart === null) !== (breakEnd === null) || (breakStart !== null && breakEnd! <= breakStart)) {
      return { error: "Confira o intervalo: informe início e fim, com o fim depois do início" };
    }
    rows.push({ businessId: business.id, weekday, openMin, closeMin, breakStart, breakEnd });
  }
  await prisma.$transaction([
    prisma.workingHour.deleteMany({ where: { businessId: business.id } }),
    prisma.workingHour.createMany({ data: rows }),
  ]);
  revalidatePath("/painel/horarios");
  return { ok: "Horários salvos" };
}

// ---------- Configurações ----------

const settingsSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(60),
  slug: z.string().trim(),
  phone: z.string().refine(isValidPhone, "WhatsApp inválido"),
  address: z.string().trim().max(140).optional(),
  description: z.string().trim().max(160).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
  slotInterval: z.coerce.number().int().min(5).max(120),
  minNoticeMinutes: z.coerce.number().int().min(0).max(7 * 24 * 60),
  maxDaysAhead: z.coerce.number().int().min(1).max(180),
});

export async function saveSettings(_: ActionState, fd: FormData): Promise<ActionState> {
  const business = await requireBusiness();
  const parsed = settingsSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;
  const slug = slugify(data.slug);
  if (slug.length < 3 || RESERVED_SLUGS.has(slug)) return { error: "Escolha outro endereço (mínimo 3 letras)" };
  if (slug !== business.slug) {
    const taken = await prisma.business.findUnique({ where: { slug }, select: { id: true } });
    if (taken) return { error: "Esse endereço já está em uso" };
  }
  await prisma.business.update({
    where: { id: business.id },
    data: {
      ...data,
      slug,
      phone: normalizePhone(data.phone),
      address: data.address || null,
      description: data.description || null,
    },
  });
  revalidatePath("/painel", "layout");
  return { ok: "Configurações salvas" };
}

// ---------- Assinatura ----------

export async function startCheckout(): Promise<ActionState> {
  const business = await requireBusiness();
  if (!billingConfigured()) {
    return { error: "Pagamento ainda não configurado. Defina MP_ACCESS_TOKEN nas variáveis de ambiente." };
  }
  let initPoint: string;
  try {
    const sub = await createSubscription({
      businessId: business.id,
      payerEmail: business.owner.email,
      backUrl: appUrl("/painel/assinatura?retorno=1"),
    });
    await prisma.business.update({ where: { id: business.id }, data: { subscriptionId: sub.id } });
    initPoint = sub.init_point;
  } catch (e) {
    console.error(e);
    return { error: "Não foi possível abrir o pagamento agora. Tente de novo em instantes." };
  }
  redirect(initPoint);
}

export async function cancelPlan(): Promise<ActionState> {
  const business = await requireBusiness();
  if (!business.subscriptionId || !billingConfigured()) return { error: "Nenhuma assinatura ativa" };
  try {
    await cancelSubscription(business.subscriptionId);
  } catch (e) {
    console.error(e);
    return { error: "Não foi possível cancelar agora. Tente de novo." };
  }
  // Mantém o acesso até o fim do mês já pago.
  const periodEnd = business.currentPeriodEnd ?? new Date(Date.now() + 30 * 86_400_000);
  await prisma.business.update({
    where: { id: business.id },
    data: { subscriptionStatus: "canceled", currentPeriodEnd: periodEnd },
  });
  revalidatePath("/painel", "layout");
  return { ok: "Assinatura cancelada. Sua agenda continua no ar até o fim do período pago." };
}
