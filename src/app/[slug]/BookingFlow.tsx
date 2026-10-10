"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDuration, formatPrice } from "@/lib/format";
import { formatDateShort } from "@/lib/time";

type Service = { id: string; name: string; description: string | null; durationMin: number; priceCents: number };
type Professional = { id: string; name: string };
type SlotOption = { time: string; minutes: number };

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-base font-semibold">
      <span
        className="grid h-6 w-6 place-items-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: "var(--brand)" }}
      >
        {n}
      </span>
      {children}
    </h2>
  );
}

const selected = "choice-selected";

export function BookingFlow({
  slug,
  services,
  professionals,
  dates,
}: {
  slug: string;
  services: Service[];
  professionals: Professional[];
  dates: string[];
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState<string | null>(services.length === 1 ? services[0].id : null);
  const [professionalId, setProfessionalId] = useState<string>("");
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotOption[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const hasPros = professionals.length > 0;

  useEffect(() => {
    setMinutes(null);
    if (!serviceId || !date) {
      setSlots(null);
      return;
    }
    const controller = new AbortController();
    setLoadingSlots(true);
    const params = new URLSearchParams({ serviceId, date });
    if (professionalId) params.set("professionalId", professionalId);
    fetch(`/api/public/${slug}/slots?${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch((e) => {
        if (e.name !== "AbortError") setSlots([]);
      })
      .finally(() => setLoadingSlots(false));
    return () => controller.abort();
  }, [slug, serviceId, professionalId, date, reloadKey]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !date || minutes === null) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/${slug}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          professionalId: professionalId || null,
          date,
          minutes,
          customerName: name,
          customerPhone: phone,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível agendar. Tente novamente.");
        if (res.status === 409) setReloadKey((k) => k + 1); // recarrega os horários livres
        setSubmitting(false);
        return;
      }
      router.push(`/${slug}/agendamento/${data.code}?novo=1`);
    } catch {
      setError("Sem conexão. Tente novamente.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <section className="card">
        <StepTitle n={1}>Escolha o serviço</StepTitle>
        <div className="mt-4 grid gap-2">
          {services.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => setServiceId(s.id)}
              className={`flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3 text-left outline-none transition hover:border-stone-300 ${serviceId === s.id ? selected : ""}`}
            >
              <span>
                <span className="block font-medium">{s.name}</span>
                {s.description && <span className="block text-xs text-stone-500">{s.description}</span>}
                <span className="block text-xs text-stone-500">{formatDuration(s.durationMin)}</span>
              </span>
              <span className="font-semibold">{formatPrice(s.priceCents)}</span>
            </button>
          ))}
        </div>
      </section>

      {service && hasPros && (
        <section className="card">
          <StepTitle n={2}>Com quem?</StepTitle>
          <div className="mt-4 flex flex-wrap gap-2">
            {[{ id: "", name: "Qualquer profissional" }, ...professionals].map((p) => (
              <button
                type="button"
                key={p.id || "any"}
                onClick={() => setProfessionalId(p.id)}
                className={`rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium outline-none transition hover:border-stone-300 ${professionalId === p.id ? selected : ""}`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {service && (
        <section className="card">
          <StepTitle n={hasPros ? 3 : 2}>Escolha o dia e o horário</StepTitle>
          {dates.length === 0 ? (
            <p className="mt-3 text-sm text-stone-600">Nenhum dia disponível no momento.</p>
          ) : (
            <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-2">
              {dates.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDate(d)}
                  className={`shrink-0 rounded-xl border border-stone-200 px-3 py-2 text-sm font-medium outline-none transition hover:border-stone-300 ${date === d ? selected : ""}`}
                >
                  {formatDateShort(d)}
                </button>
              ))}
            </div>
          )}

          {date && (
            <div className="mt-4">
              {loadingSlots ? (
                <p className="text-sm text-stone-500">Buscando horários livres...</p>
              ) : slots && slots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((s) => (
                    <button
                      type="button"
                      key={s.minutes}
                      onClick={() => setMinutes(s.minutes)}
                      className={`rounded-xl border border-stone-200 py-2.5 text-sm font-semibold outline-none transition hover:border-stone-300 ${minutes === s.minutes ? selected : ""}`}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-600">Sem horários livres nesse dia. Tente outro dia.</p>
              )}
            </div>
          )}
        </section>
      )}

      {service && date && minutes !== null && (
        <section className="card">
          <StepTitle n={hasPros ? 4 : 3}>Seus dados</StepTitle>
          <div className="mt-4 space-y-3">
            <div>
              <label className="label" htmlFor="customerName">Nome</label>
              <input id="customerName" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </div>
            <div>
              <label className="label" htmlFor="customerPhone">WhatsApp</label>
              <input id="customerPhone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="(11) 99999-8888" autoComplete="tel" required />
            </div>
            <div>
              <label className="label" htmlFor="notes">Observação (opcional)</label>
              <input id="notes" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} />
            </div>
          </div>
          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" className="btn-dynamic mt-4 w-full py-3 text-base" disabled={submitting}>
            {submitting ? "Agendando..." : `Agendar ${service.name} • ${formatPrice(service.priceCents)}`}
          </button>
        </section>
      )}
    </form>
  );
}
