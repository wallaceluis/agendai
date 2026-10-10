"use client";

import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/SubmitButton";
import { signup, type FormState } from "../actions";

export function SignupForm() {
  const [state, action] = useFormState<FormState, FormData>(signup, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="businessName">Nome do salão, barbearia ou estúdio</label>
        <input className="input" id="businessName" name="businessName" placeholder="Studio Bella" required />
      </div>
      <div>
        <label className="label" htmlFor="name">Seu nome</label>
        <input className="input" id="name" name="name" autoComplete="name" required />
      </div>
      <div>
        <label className="label" htmlFor="phone">WhatsApp do estabelecimento</label>
        <input className="input" id="phone" name="phone" inputMode="tel" placeholder="(11) 99999-8888" required />
      </div>
      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Senha</label>
        <input className="input" id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
      </div>
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <SubmitButton className="btn-primary w-full py-3" pendingText="Criando sua agenda...">
        Criar minha agenda grátis
      </SubmitButton>
    </form>
  );
}
