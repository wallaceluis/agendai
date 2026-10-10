import { describe, expect, it } from "vitest";
import { formatPhone, normalizePhone, parsePriceToCents, slugify } from "./format";
import { verifyWebhookSignature } from "./billing";
import { createHmac } from "node:crypto";

describe("format", () => {
  it("normaliza telefone brasileiro", () => {
    expect(normalizePhone("(11) 99999-8888")).toBe("5511999998888");
    expect(normalizePhone("+55 11 99999-8888")).toBe("5511999998888");
    expect(formatPhone("5511999998888")).toBe("(11) 99999-8888");
  });

  it("converte preço digitado em centavos", () => {
    expect(parsePriceToCents("50,00")).toBe(5000);
    expect(parsePriceToCents("R$ 1.250,50")).toBe(125050);
    expect(parsePriceToCents("35")).toBe(3500);
    expect(parsePriceToCents("35.9")).toBe(3590);
  });

  it("gera slug sem acento", () => {
    expect(slugify("Salão da Conceição & Cia")).toBe("salao-da-conceicao-cia");
  });
});

describe("verifyWebhookSignature", () => {
  it("aceita assinatura válida e recusa inválida", () => {
    const secret = "segredo";
    const ts = "1700000000";
    const v1 = createHmac("sha256", secret).update(`id:abc123;request-id:req-1;ts:${ts};`).digest("hex");
    const ok = verifyWebhookSignature({ signature: `ts=${ts},v1=${v1}`, requestId: "req-1", dataId: "ABC123", secret });
    expect(ok).toBe(true);
    expect(verifyWebhookSignature({ signature: `ts=${ts},v1=00`, requestId: "req-1", dataId: "abc123", secret })).toBe(false);
  });
});
