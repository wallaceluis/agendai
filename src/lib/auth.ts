import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifySession } from "./session";

export async function startSession(userId: string) {
  cookies().set(SESSION_COOKIE, await signSession(userId), sessionCookieOptions);
}

export function endSession() {
  cookies().delete(SESSION_COOKIE);
}

export async function currentUserId(): Promise<string | null> {
  return verifySession(cookies().get(SESSION_COOKIE)?.value);
}

/** Dono logado + estabelecimento. Redireciona para o login se não houver sessão. */
export async function requireBusiness() {
  const userId = await currentUserId();
  if (!userId) redirect("/entrar");
  const business = await prisma.business.findUnique({
    where: { ownerId: userId },
    include: { owner: { select: { name: true, email: true } } },
  });
  if (!business) redirect("/entrar");
  return business;
}
