import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Entrar" };

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-2xl font-bold">Entrar no painel</h1>
      <div className="mt-6">
        <LoginForm next={searchParams.next} />
      </div>
      <p className="mt-6 text-center text-sm text-stone-600">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-brand-700">Criar grátis</Link>
      </p>
    </div>
  );
}
