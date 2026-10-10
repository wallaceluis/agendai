"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { endSession, startSession } from "@/lib/auth";
import { TRIAL_DAYS } from "@/lib/billing";
import { prisma } from "@/lib/db";
import { isValidPhone, normalizePhone, RESERVED_SLUGS, slugify } from "@/lib/format";
import { DEFAULT_HOURS, DEFAULT_SERVICES } from "@/lib/onboarding";

export type FormState = { error?: string };

const signupSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome"),
  businessName: z.string().trim().min(2, "Informe o nome do estabelecimento"),
  phone: z.string().refine(isValidPhone, "WhatsApp inválido. Use DDD + número"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
});

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "meu-salao";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    if (RESERVED_SLUGS.has(candidate)) continue;
    const taken = await prisma.business.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function signup(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (exists) return { error: "Já existe uma conta com esse e-mail. Faça login." };

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash: await bcrypt.hash(data.password, 10),
      business: {
        create: {
          name: data.businessName,
          slug: await uniqueSlug(data.businessName),
          phone: normalizePhone(data.phone),
          trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000),
          hours: { create: DEFAULT_HOURS },
          services: { create: DEFAULT_SERVICES },
        },
      },
    },
  });

  await startSession(user.id);
  redirect("/painel?bemvindo=1");
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
  next: z.string().optional(),
});

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password, next } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "E-mail ou senha incorretos" };
  }
  await startSession(user.id);
  redirect(next && next.startsWith("/painel") ? next : "/painel");
}

export async function logout() {
  endSession();
  redirect("/");
}
