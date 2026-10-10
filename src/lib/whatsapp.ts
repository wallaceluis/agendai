import { formatPrice } from "./format";

export function waLink(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

type BookingInfo = {
  businessName: string;
  serviceName: string;
  professionalName?: string | null;
  dateLabel: string;
  timeLabel: string;
  priceCents: number;
  customerName: string;
  code: string;
};

/** Mensagem que o cliente manda para o estabelecimento depois de agendar. */
export function customerConfirmMessage(b: BookingInfo, manageUrl: string): string {
  return [
    `Olá, ${b.businessName}! Acabei de agendar pelo site:`,
    ``,
    `*${b.serviceName}*${b.professionalName ? ` com ${b.professionalName}` : ""}`,
    `${b.dateLabel} às ${b.timeLabel}`,
    `Valor: ${formatPrice(b.priceCents)}`,
    `Nome: ${b.customerName}`,
    `Código: ${b.code}`,
    ``,
    `Podem confirmar? Detalhes: ${manageUrl}`,
  ].join("\n");
}

/** Mensagem que o dono manda para o cliente confirmar ou lembrar o horário. */
export function ownerReminderMessage(b: BookingInfo, manageUrl: string): string {
  const firstName = b.customerName.split(" ")[0];
  return [
    `Olá, ${firstName}! Aqui é do ${b.businessName}.`,
    `Seu horário de *${b.serviceName}* está marcado para ${b.dateLabel} às ${b.timeLabel}.`,
    `Pode confirmar sua presença? Se precisar desmarcar: ${manageUrl}`,
  ].join("\n");
}
