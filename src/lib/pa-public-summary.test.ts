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
    assert.deepEqual(Object.keys(summary).sort(), ["demonstrativo", "disponivel", "especialidades", "espera", "riscos", "totais"]);
  });
  it("groups by specialty with counts only and rejects odd labels", () => {
    const row = (especialidade: string, grupo: string, esperaAtendMin = 10) => ({ especialidade, grupo, esperaAtendMin, esperaClassifMin: 3, foraSla: false, paciente: "PRIVATE_NAME" });
    const pacientes = [row("GINECOLOGIA/OBSTETRICIA", "aguardando", 70), row("GINECOLOGIA/OBSTETRICIA", "aguardando", 30), row("GINECOLOGIA/OBSTETRICIA", "em-curso"), row("ENFERMAGEM OBSTETRICIA", "finalizado"), row("<script>PRIVATE_NAME</script>", "finalizado")];
    const list = projectPaSummary({ ...source, pacientes }, { suppressSmall: false }).especialidades;
    assert.deepEqual(list.map((s) => s.nome), ["Ginecologia/Obstetrícia", "Enfermagem Obstetrícia"]);
    assert.deepEqual([list[0]?.total, list[0]?.aguardando, list[0]?.emCurso, list[0]?.maiorMin], [3, 2, 1, 70]);
    assert.equal(JSON.stringify(list).includes("PRIVATE_"), false);
    assert.equal(projectPaSummary({ ...source, pacientes }, { suppressSmall: true }).especialidades[0]?.total, null);
  });
  it("computes waiting-time aggregates without leaking row data", () => {
    const row = (cor: string, esperaAtendMin: number, situacao = "Aguardando médico") => ({ grupo: "aguardando", cor, situacao, esperaAtendMin, esperaClassifMin: 5, slaMin: 120, paciente: "PRIVATE_NAME", senha: "PRIVATE_TICKET" });
    const pacientes = [row("Verde", 70), row("Verde", 30), row("Azul", 213), row("Verde", 20, "Aguardando classificação"), { ...row("Verde", 999), grupo: "finalizado" }];
    const wait = projectPaSummary({ ...source, pacientes }, { suppressSmall: false }).espera;
    assert.equal(wait.maiorMin, 213);
    assert.equal(wait.aguardandoMedico, 3);
    assert.equal(wait.aguardandoClassificacao, 1);
    const verde = wait.porCor.find((r) => r.cor === "Verde");
    assert.deepEqual([verde?.aguardando, verde?.maiorMin, verde?.previstoMin], [3, 70, 120]);
    assert.equal(wait.porCor.find((r) => r.cor === "Azul")?.maiorMin, null);
    assert.equal(JSON.stringify(wait).includes("PRIVATE_"), false);
    const hidden = projectPaSummary({ ...source, pacientes }, { suppressSmall: true }).espera;
    assert.equal(hidden.porCor.find((r) => r.cor === "Verde")?.aguardando, null);
    assert.equal(hidden.maiorMin, 213);
  });
  it("suppresses small risk groups while keeping zero and larger counts", () => {
    assert.deepEqual(projectPaSummary(source, { suppressSmall: true }).riscos.slice(0, 3).map((r) => r.quantidade), [null, null, 20]);
    assert.equal(projectPaSummary(source, { suppressSmall: true }).riscos[4]?.quantidade, 0);
  });
  it("shows exact small counts by default (owner decision)", () => {
    assert.deepEqual(projectPaSummary(source).riscos.slice(0, 3).map((r) => r.quantidade), [1, 4, 20]);
  });
  it("hides small stage counts and a complementary value so they cannot be derived from the total", () => {
    const t = projectPaSummary({ ...source, totais: { ...source.totais, total: 16, aguardando: 5, emCurso: 2, finalizados: 9, porCor: { Verde: 16 } } }, { suppressSmall: true }).totais;
    assert.deepEqual([t.aguardando, t.emCurso, t.finalizados], [null, null, 9]);
    const u = projectPaSummary({ ...source, totais: { ...source.totais, total: 30, aguardando: 20, emCurso: 3, finalizados: 7, porCor: { Verde: 30 } } }, { suppressSmall: true }).totais;
    assert.deepEqual([u.aguardando, u.emCurso, u.finalizados], [20, null, null]);
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