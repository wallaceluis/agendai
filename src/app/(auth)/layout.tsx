import { Logo } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-stone-50 px-4 py-10">
      <Logo />
      <div className="mt-6 w-full max-w-md">{children}</div>
    </div>
  );
}
