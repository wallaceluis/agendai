import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";
import { requireBusiness } from "@/lib/auth";
import { hasAccess, trialDaysLeft } from "@/lib/billing";

export const dynamic = "force-dynamic";
export const metadata = { title: "Painel", robots: { index: false } };

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const business = await requireBusiness();
  const access = hasAccess(business);
  const days = trialDaysLeft(business);

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center justify-between py-3">
            <Logo href="/painel" />
            <div className="flex items-center gap-3 text-sm">
              <Link href={`/${business.slug}`} target="_blank" className="hidden font-medium text-brand-700 hover:underline sm:block">
                Ver minha página ↗
              </Link>
              <form action={logout}>
                <button className="font-medium text-stone-500 hover:text-stone-800">Sair</button>
              </form>
            </div>
          </div>
          <div className="pb-2">
            <NavLinks />
          </div>
        </div>
      </header>

      {!access ? (
        <div className="bg-red-600 px-4 py-2.5 text-center text-sm text-white">
          Sua agenda online está pausada.{" "}
          <Link href="/painel/assinatura" className="font-semibold underline">Assine para voltar a receber agendamentos</Link>
        </div>
      ) : business.subscriptionStatus === "trialing" ? (
        <div className="bg-brand-50 px-4 py-2 text-center text-sm text-brand-900">
          {days > 0 ? `Teste grátis: faltam ${days} ${days === 1 ? "dia" : "dias"}.` : "Seu teste grátis termina hoje."}{" "}
          <Link href="/painel/assinatura" className="font-semibold underline">Assinar agora</Link>
        </div>
      ) : null}

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
