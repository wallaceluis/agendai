"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/painel", label: "Agenda" },
  { href: "/painel/servicos", label: "Serviços" },
  { href: "/painel/profissionais", label: "Profissionais" },
  { href: "/painel/horarios", label: "Horários" },
  { href: "/painel/configuracoes", label: "Configurações" },
  { href: "/painel/assinatura", label: "Assinatura" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 text-sm">
      {links.map((l) => {
        const active = l.href === "/painel" ? pathname === "/painel" || pathname.startsWith("/painel/agendamentos") : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`shrink-0 rounded-lg px-3 py-2 font-medium transition ${
              active ? "bg-brand-50 text-brand-700" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
