import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Agendaí: agendamento online para salões e barbearias",
    template: "%s | Agendaí",
  },
  description:
    "Seus clientes marcam horário sozinhos por um link, 24 horas por dia. Agenda, serviços e confirmação pelo WhatsApp para salões, barbearias e manicures.",
};

export const viewport: Viewport = { themeColor: "#db2777" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
