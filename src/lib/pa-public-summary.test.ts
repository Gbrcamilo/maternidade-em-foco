import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { projectPaSummary } from "./pa-public-summary";

const source = {
  disponivel: true, nomeCompleto: true,
  meta: { fonte: "real", geradoEm: "PRIVATE_METADATA" },
  totais: { total: 40, aguardando: 20, emCurso: 8, finalizados: 12, foraSla: 7, paciente: "PRIVATE_NAME", porCor: { Vermelho: 1, Laranja: 4, Amarelo: 20, Verde: 15, Azul: 0, Branco: 0, "Sem cor": 0, nome: "PRIVATE_NAME" } },
  pacientes: [{ paciente: "PRIVATE_NAME", atendimento: "PRIVATE_CODE", senha: "PRIVATE_TICKET" }],
  especialidades: [{ especialidade: "PRIVATE_TEXT" }],
};
describe("Public PA summary", () => {
  it("returns only explicitly approved aggregates", () => {
    const summary = projectPaSummary(source);
    assert.deepEqual(summary.totais, { total: 40, aguardando: 20, emCurso: 8, finalizados: 12, foraSla: 7 });
    assert.equal(JSON.stringify(summary).includes("PRIVATE_"), false);
    assert.deepEqual(Object.keys(summary).sort(), ["demonstrativo", "disponivel", "riscos", "totais"]);
  });
  it("suppresses small risk groups while keeping zero and larger counts", () => {
    assert.deepEqual(projectPaSummary(source).riscos.slice(0, 3).map((r) => r.quantidade), [null, null, 20]);
    assert.equal(projectPaSummary(source).riscos[4]?.quantidade, 0);
  });
  it("rejects text in aggregate counters", () => {
    assert.throws(() => projectPaSummary({ ...source, totais: { ...source.totais, total: "PRIVATE_NAME" } }));
  });
  it("allows unavailable PA without individual information", () => {
    const result = projectPaSummary({ disponivel: false, pacientes: source.pacientes });
    assert.equal(result.disponivel, false);
    assert.equal(JSON.stringify(result).includes("PRIVATE_"), false);
  });
});