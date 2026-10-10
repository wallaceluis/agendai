import { ActionForm } from "@/components/ActionForm";
import { SubmitButton } from "@/components/SubmitButton";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteProfessional, saveProfessional, toggleProfessional } from "../actions";

export default async function ProfessionalsPage() {
  const business = await requireBusiness();
  const professionals = await prisma.professional.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profissionais</h1>
        <p className="text-sm text-stone-500">
          Cada profissional tem a própria agenda, então dois clientes podem ser atendidos no mesmo horário. Se você
          atende sozinho(a), pode deixar vazio.
        </p>
      </div>

      <ActionForm action={saveProfessional} className="card flex flex-col gap-3 sm:flex-row sm:items-end" resetOnSuccess>
        <div className="flex-1">
          <label className="label" htmlFor="name">Nome</label>
          <input className="input" id="name" name="name" placeholder="Ex: Juliana" required />
        </div>
        <SubmitButton>Adicionar</SubmitButton>
      </ActionForm>

      {professionals.length === 0 ? (
        <p className="text-sm text-stone-500">Nenhum profissional cadastrado. A agenda atende um cliente por vez.</p>
      ) : (
        <ul className="space-y-3">
          {professionals.map((p) => (
            <li key={p.id} className={`card flex flex-col gap-3 sm:flex-row sm:items-center ${p.active ? "" : "opacity-60"}`}>
              <ActionForm action={saveProfessional} className="flex flex-1 gap-2">
                <input type="hidden" name="id" value={p.id} />
                <input className="input" name="name" defaultValue={p.name} required />
                <SubmitButton className="btn-secondary">Salvar</SubmitButton>
              </ActionForm>
              <div className="flex gap-2">
                <form action={toggleProfessional.bind(null, p.id)}>
                  <button className="btn-secondary px-3 py-1.5 text-xs">{p.active ? "Pausar" : "Ativar"}</button>
                </form>
                <form action={deleteProfessional.bind(null, p.id)}>
                  <button className="btn-danger px-3 py-1.5 text-xs">Excluir</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
