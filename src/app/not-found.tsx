import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-3 text-xl font-bold">Página não encontrada</h1>
      <p className="mt-1 text-stone-600">Confira o link que você recebeu do estabelecimento.</p>
      <Link href="/" className="btn-primary mt-6">Ir para o início</Link>
    </div>
  );
}
