import { describe, expect, test } from "bun:test";
import { aggregateSchema } from "./pa-analysis-schema";

const valid = {
  periodoMin: 60, aguardandoClassificacao: 12, aguardandoMedico: 30, emAtendimento: 8,
  finalizados: 18, foraSla: 9, esperaMediaClassificacaoMin: 18, esperaMediaMedicoMin: 65,
  maiorEsperaMedicoMin: 140, medicosDisponiveis: 2, classificadoresDisponiveis: 1,
  porRisco: { Vermelho: 0, Laranja: 3, Amarelo: 12, Verde: 10, Azul: 4, Branco: 1, "Sem cor": 0 },
};
describe("PA aggregate privacy and validation", () => {
  test("accepts valid aggregate-only input", () => expect(aggregateSchema.safeParse(valid).success).toBe(true));
  test("rejects patient identifiers and extra fields", () => {
    for (const key of ["paciente", "senha", "atendimento", "nome", "observacoes"]) expect(aggregateSchema.safeParse({ ...valid, [key]: "not permitted" }).success).toBe(false);
  });
  test("rejects identifiers in risk data", () => expect(aggregateSchema.safeParse({ ...valid, porRisco: { ...valid.porRisco, paciente: "not permitted" } }).success).toBe(false));
  test("rejects text, negative counts, fractions and oversized input", () => {
    for (const value of ["30", "patient name", -1, 1.5, 10001]) expect(aggregateSchema.safeParse({ ...valid, aguardandoMedico: value }).success).toBe(false);
  });
  test("requires risk totals to match the medical queue", () => expect(aggregateSchema.safeParse({ ...valid, aguardandoMedico: 31 }).success).toBe(false));
  test("rejects impossible SLA counts and wait times", () => {
    expect(aggregateSchema.safeParse({ ...valid, foraSla: 31 }).success).toBe(false);
    expect(aggregateSchema.safeParse({ ...valid, maiorEsperaMedicoMin: 10 }).success).toBe(false);
  });
});