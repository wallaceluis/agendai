import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PLAN_PRICE, TRIAL_DAYS } from "@/lib/billing";

const features = [
  {
    title: "Link de agendamento 24h",
    text: "Coloque na bio do Instagram e no WhatsApp. O cliente escolhe serviço, profissional e horário sem precisar te chamar.",
  },
  {
    title: "Confirmação pelo WhatsApp",
    text: "Depois de marcar, o cliente te avisa com uma mensagem pronta. Você confirma ou lembra o horário com um toque.",
  },
  {
    title: "Agenda sem conflito",
    text: "Os horários respeitam a duração de cada serviço, o almoço e a agenda de cada profissional. Nada de dois clientes no mesmo horário.",
  },
  {
    title: "Serviços e preços",
    text: "Corte, escova, barba, unha em gel: cadastre duração e valor e mostre tudo numa página bonita com a sua cor.",
  },
  {
    title: "Vários profissionais",
    text: "Cada profissional tem a própria agenda. O cliente escolhe com quem quer ou deixa o sistema achar o primeiro livre.",
  },
  {
    title: "Funciona no celular",
    text: "O painel foi feito para usar no balcão, pelo celular. Veja o dia, marque atendido e registre quem faltou.",
  },
];

const steps = [
  ["Crie sua conta", "Nome do salão, WhatsApp e pronto. Já vem com horários e serviços de exemplo."],
  ["Ajuste serviços e horários", "Edite preços, durações, profissionais e o horário de funcionamento."],
  ["Divulgue seu link", "agendai.app/seu-salao na bio, no status e nos grupos. Os agendamentos chegam sozinhos."],
];

export default function Home() {
  const price = PLAN_PRICE.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return (
    <div className="bg-white">
      <header className="sticky top-0 z-20 border-b border-stone-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
          <nav className="flex items-center gap-2 text-sm">
            <a href="#precos" className="hidden px-3 py-2 font-medium text-stone-600 hover:text-stone-900 sm:block">
              Preços
            </a>
            <Link href="/entrar" className="px-3 py-2 font-medium text-stone-600 hover:text-stone-900">
              Entrar
            </Link>
            <Link href="/cadastro" className="btn-primary">
              Começar grátis
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 to-white" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="badge bg-brand-100 text-brand-700">Para salões, barbearias e manicures</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Pare de marcar horário no WhatsApp. <span className="text-brand-600">Deixe o cliente agendar sozinho.</span>
            </h1>
            <p className="mt-5 text-lg text-stone-600">
              Um link com seus serviços e horários livres. O cliente escolhe, confirma pelo WhatsApp e aparece na sua
              agenda. Você atende em vez de responder mensagem.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cadastro" className="btn-primary px-6 py-3 text-base">
                Testar {TRIAL_DAYS} dias grátis
              </Link>
              <Link href="/studio-bella" className="btn-secondary px-6 py-3 text-base">
                Ver página de exemplo
              </Link>
            </div>
            <p className="mt-3 text-sm text-stone-500">Sem cartão para testar. Depois, {price}/mês.</p>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="rounded-[2rem] border-8 border-stone-900 bg-white p-4 shadow-2xl">
              <div className="rounded-2xl bg-brand-600 p-4 text-white">
                <p className="text-xs opacity-80">agendai.app/studio-bella</p>
                <p className="mt-1 text-lg font-bold">Studio Bella</p>
                <p className="text-xs opacity-80">Cabelo, unhas e sobrancelha</p>
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-stone-400">Escolha o horário</p>
              <div className="mt-2 flex gap-2 text-xs">
                {["Ter 14", "Qua 15", "Qui 16"].map((d, i) => (
                  <span
                    key={d}
                    className={`rounded-lg px-3 py-2 font-semibold ${i === 1 ? "bg-brand-600 text-white" : "bg-stone-100"}`}
                  >
                    {d}
                  </span>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                {["09:00", "09:30", "10:30", "11:00", "14:00", "15:30"].map((t, i) => (
                  <span
                    key={t}
                    className={`rounded-lg border py-2 text-center font-medium ${i === 3 ? "border-brand-600 bg-brand-50 text-brand-700" : "border-stone-200"}`}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-[#25D366] py-3 text-center text-sm font-semibold text-white">
                Confirmar pelo WhatsApp
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold tracking-tight">Tudo o que o seu salão precisa para agendar</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-stone-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-stone-50 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight">Começa a funcionar hoje</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map(([title, text], i) => (
              <li key={title} className="card">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-stone-600">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="precos" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold tracking-tight">Um plano, tudo incluso</h2>
        <div className="mx-auto mt-10 max-w-md rounded-3xl border-2 border-brand-600 bg-white p-8 shadow-xl">
          <p className="font-semibold text-brand-700">Profissional</p>
          <p className="mt-2 text-5xl font-extrabold">
            {price}
            <span className="text-base font-medium text-stone-500">/mês</span>
          </p>
          <ul className="mt-6 space-y-2 text-sm text-stone-700">
            {[
              "Agendamentos ilimitados",
              "Profissionais ilimitados",
              "Página de agendamento com sua cor",
              "Confirmação e lembrete pelo WhatsApp",
              "Agendamento manual pelo painel",
              "Cancele quando quiser",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-brand-600">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <Link href="/cadastro" className="btn-primary mt-8 w-full py-3 text-base">
            Começar {TRIAL_DAYS} dias grátis
          </Link>
          <p className="mt-3 text-center text-xs text-stone-500">Pague com cartão pelo Mercado Pago.</p>
        </div>
      </section>

      <footer className="border-t border-stone-100 py-8 text-center text-sm text-stone-500">
        © {new Date().getFullYear()} Agendaí. Feito para quem vive de horário marcado.
      </footer>
    </div>
  );
}
