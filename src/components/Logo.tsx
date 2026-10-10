import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
          <path d="m9 15 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>
        Agenda<span className="text-brand-600">í</span>
      </span>
    </Link>
  );
}
