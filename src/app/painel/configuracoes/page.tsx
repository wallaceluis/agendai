import { ActionForm } from "@/components/ActionForm";
import { CopyButton } from "@/components/CopyButton";
import { SubmitButton } from "@/components/SubmitButton";
import { appUrl } from "@/lib/app-url";
import { requireBusiness } from "@/lib/auth";
import { formatPhone } from "@/lib/format";
import { saveSettings } from "../actions";

export default async function SettingsPage() {
  const business = await requireBusiness();
  const publicUrl = appUrl(`/${business.slug}`);
  const base = appUrl("/");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-stone-500">Como seu estabelecimento aparece para os clientes.</p>
      </div>

      <div className="card flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-stone-500">Seu link de agendamento</p>
          <p className="truncate font-semibold">{publicUrl}</p>
        </div>
        <CopyButton text={publicUrl} />
        <a href={publicUrl} target="_blank" className="btn-secondary">Abrir</a>
      </div>

      <ActionForm action={saveSettings} className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">Nome do estabelecimento</label>
            <input className="input" id="name" name="name" defaultValue={business.name} required />
          </div>
          <div>
            <label className="label" htmlFor="slug">Endereço da página</label>
            <div className="flex items-center rounded-xl border border-stone-300 bg-stone-50 focus-within:border-brand-500">
              <span className="pl-3 text-sm text-stone-500">{base.replace(/^https?:\/\//, "")}</span>
              <input className="w-full rounded-r-xl bg-white px-2 py-2.5 text-sm outline-none" id="slug" name="slug" defaultValue={business.slug} required />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="phone">WhatsApp</label>
            <input className="input" id="phone" name="phone" defaultValue={formatPhone(business.phone)} required />
          </div>
          <div>
            <label className="label" htmlFor="color">Cor da página</label>
            <input className="h-11 w-full cursor-pointer rounded-xl border border-stone-300 bg-white p-1" id="color" name="color" type="color" defaultValue={business.color} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="address">Endereço</label>
            <input className="input" id="address" name="address" defaultValue={business.address ?? ""} placeholder="Rua, número, bairro, cidade" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="description">Frase de apresentação</label>
            <input className="input" id="description" name="description" defaultValue={business.description ?? ""} maxLength={160} placeholder="Ex: Cabelo, unhas e sobrancelha no centro de Campinas" />
          </div>
        </div>

        <h2 className="border-t border-stone-100 pt-4 font-semibold">Regras de agendamento</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="slotInterval">Horários a cada</label>
            <select className="input" id="slotInterval" name="slotInterval" defaultValue={business.slotInterval}>
              {[10, 15, 20, 30, 45, 60].map((v) => <option key={v} value={v}>{v} minutos</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="minNoticeMinutes">Antecedência mínima</label>
            <select className="input" id="minNoticeMinutes" name="minNoticeMinutes" defaultValue={business.minNoticeMinutes}>
              {[[0, "Nenhuma"], [30, "30 minutos"], [60, "1 hora"], [120, "2 horas"], [240, "4 horas"], [720, "12 horas"], [1440, "1 dia"]].map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="maxDaysAhead">Agendar até</label>
            <select className="input" id="maxDaysAhead" name="maxDaysAhead" defaultValue={business.maxDaysAhead}>
              {[7, 14, 30, 60, 90].map((v) => <option key={v} value={v}>{v} dias à frente</option>)}
            </select>
          </div>
        </div>
        <SubmitButton>Salvar configurações</SubmitButton>
      </ActionForm>
    </div>
  );
}
