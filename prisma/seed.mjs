// Cria o estabelecimento de demonstração usado no botão "Ver página de exemplo".
// Login: demo@agendai.app / demo1234
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@agendai.app";
  await prisma.user.deleteMany({ where: { email } });
  await prisma.user.create({
    data: {
      email,
      name: "Bella Demo",
      passwordHash: await bcrypt.hash("demo1234", 10),
      business: {
        create: {
          name: "Studio Bella",
          slug: "studio-bella",
          phone: "5511999998888",
          address: "Rua das Flores, 123, Centro, São Paulo",
          description: "Cabelo, unhas e sobrancelha com hora marcada",
          color: "#db2777",
          subscriptionStatus: "active",
          trialEndsAt: new Date(Date.now() + 3650 * 86_400_000),
          hours: {
            create: [1, 2, 3, 4, 5, 6].map((weekday) => ({
              weekday,
              openMin: 9 * 60,
              closeMin: weekday === 6 ? 17 * 60 : 19 * 60,
              breakStart: 12 * 60,
              breakEnd: 13 * 60,
            })),
          },
          services: {
            create: [
              { name: "Corte feminino", description: "Lavagem, corte e finalização", durationMin: 60, priceCents: 8000 },
              { name: "Escova", durationMin: 45, priceCents: 5000 },
              { name: "Manicure", durationMin: 45, priceCents: 3500 },
              { name: "Pé e mão", durationMin: 90, priceCents: 6000 },
              { name: "Design de sobrancelha", durationMin: 30, priceCents: 4000 },
            ],
          },
          professionals: { create: [{ name: "Juliana" }, { name: "Carla" }] },
        },
      },
    },
  });
  console.log("Demo criada: /studio-bella (demo@agendai.app / demo1234)");
}

main().finally(() => prisma.$disconnect());
