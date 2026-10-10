import Link from "next/link";
import { TRIAL_DAYS } from "@/lib/billing";
import { SignupForm } from "./SignupForm";

export const metadata = { title: "Criar conta" };

export default function SignupPage() {
  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-2xl font-bold">Crie sua agenda online</h1>
      <p className="mt-1 text-sm text-stone-600">{TRIAL_DAYS} dias grátis, sem cartão.</p>
      <div className="mt-6">
        <SignupForm />
      </div>
      <p className="mt-6 text-center text-sm text-stone-600">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-brand-700">Entrar</Link>
      </p>
    </div>
  );
}
