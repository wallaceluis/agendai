import { ActionForm } from "@/components/ActionForm";
import { SubmitButton } from "@/components/SubmitButton";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { minutesToHHMM, WEEKDAYS } from "@/lib/time";
import { saveHours } from "../actions";

export default async function HoursPage() {
  const business = await requireBusiness();
  const hours = await prisma.workingHour.findMany({ where: { businessId: business.id } });
  // Começa a semana na segunda, como o pessoal costuma pensar.
  const order = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Horário de funcionamento</h1>
        <p className="text-sm text-stone-500">Os clientes só conseguem agendar dentro desses horários. O intervalo bloqueia o almoço.</p>
      </div>
      <ActionForm action={saveHours} className="card space-y-1">
        <div className="hidden grid-cols-[8rem_1fr_1fr_1fr_1fr] gap-3 px-1 pb-2 text-xs font-semibold uppercase text-stone-400 sm:grid">
          <span>Dia</span><span>Abre</span><span>Fecha</span><span>Intervalo de</span><span>até</span>
        </div>
        {order.map((weekday) => {
          const h = hours.find((x) => x.weekday === weekday);
          return (
            <div key={weekday} className="grid grid-cols-2 items-center gap-3 border-t border-stone-100 py-3 sm:grid-cols-[8rem_1fr_1fr_1fr_1fr]">
              <label className="col-span-2 flex items-center gap-2 font-medium sm:col-span-1">
                <input type="checkbox" name={`open_${weekday}`} defaultChecked={!!h} className="h-4 w-4 accent-brand-600" />
                {WEEKDAYS[weekday]}
              </label>
              <input className="input" type="time" name={`start_${weekday}`} defaultValue={minutesToHHMM(h?.openMin ?? 540)} aria-label="Abre" />
              <input className="input" type="time" name={`end_${weekday}`} defaultValue={minutesToHHMM(h?.closeMin ?? 1140)} aria-label="Fecha" />
              <input className="input" type="time" name={`break_start_${weekday}`} defaultValue={h?.breakStart != null ? minutesToHHMM(h.breakStart) : ""} aria-label="Intervalo de" />
              <input className="input" type="time" name={`break_end_${weekday}`} defaultValue={h?.breakEnd != null ? minutesToHHMM(h.breakEnd) : ""} aria-label="Intervalo até" />
            </div>
          );
        })}
        <div className="pt-3">
          <SubmitButton>Salvar horários</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}
