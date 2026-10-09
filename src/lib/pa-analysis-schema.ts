import { z } from "zod";

const count = z.number().int().min(0).max(10000);
const minutes = z.number().min(0).max(1440);
export const aggregateSchema = z.object({
  periodoMin: z.number().int().min(15).max(1440),
  aguardandoClassificacao: count,
  aguardandoMedico: count,
  emAtendimento: count,
  finalizados: count,
  foraSla: count,
  esperaMediaClassificacaoMin: minutes,
  esperaMediaMedicoMin: minutes,
  maiorEsperaMedicoMin: minutes,
  medicosDisponiveis: z.number().int().min(0).max(1000),
  classificadoresDisponiveis: z.number().int().min(0).max(1000),
  porRisco: z.object({ Vermelho: count, Laranja: count, Amarelo: count, Verde: count, Azul: count, Branco: count, "Sem cor": count }).strict(),
}).strict().superRefine((data, ctx) => {
  if (data.foraSla > data.aguardandoMedico) ctx.addIssue({ code: "custom", path: ["foraSla"], message: "Fora do SLA não pode superar a fila para médico." });
  if (data.maiorEsperaMedicoMin < data.esperaMediaMedicoMin) ctx.addIssue({ code: "custom", path: ["maiorEsperaMedicoMin"], message: "A maior espera deve ser igual ou superior à média." });
  const riskTotal = Object.values(data.porRisco).reduce((a, b) => a + b, 0);
  if (riskTotal !== data.aguardandoMedico) ctx.addIssue({ code: "custom", path: ["porRisco"], message: "A soma das cores deve corresponder à fila para médico." });
});
export type PaAggregates = z.infer<typeof aggregateSchema>;
export const operationalSummarySchema = z.object({
  resumo: z.string(),
  nivel: z.enum(["estavel", "atencao", "critico"]),
  gargalos: z.array(z.object({ titulo: z.string(), evidencia: z.string(), acao: z.string() }).strict()),
  prioridades: z.array(z.string()),
  limitacoes: z.string(),
}).strict();
export type OperationalSummary = z.infer<typeof operationalSummarySchema>;
export type AnalysisResult = { ok: true; resumo: OperationalSummary; geradoEm: string } | { ok: false; message: string; status: number };