import { z } from "zod";

export const PA_RISKS = ["Vermelho", "Laranja", "Amarelo", "Verde", "Azul", "Branco", "Sem cor"] as const;
const count = z.number().int().min(0).max(1000000);
const totalsSchema = z.object({
  total: count, aguardando: count, emCurso: count, finalizados: count, foraSla: count,
  porCor: z.object(Object.fromEntries(PA_RISKS.map((risk) => [risk, count.optional()]))),
});

export type PaPublicSummary = {
  disponivel: boolean;
  demonstrativo: boolean;
  totais: { total: number; aguardando: number | null; emCurso: number | null; finalizados: number | null; foraSla: number };
  riscos: { cor: (typeof PA_RISKS)[number]; quantidade: number | null }[];
};
export type PaPublicResult = { aguardando: true; atualizadoEm: string } | { aguardando: false; pa: PaPublicSummary; atualizadoEm: string };

/** Hides counts of 1 to 4. If only one value is hidden, the smallest positive one is hidden too, so it cannot be recovered from the total. */
export function protectSmallCounts(values: number[]): (number | null)[] {
  const out: (number | null)[] = values.map((v) => (v > 0 && v < 5 ? null : v));
  if (out.filter((v) => v === null).length === 1) {
    let idx = -1;
    out.forEach((v, i) => { if (v !== null && v > 0 && (idx < 0 || v < (out[idx] as number))) idx = i; });
    if (idx >= 0) out[idx] = null;
  }
  return out;
}

/** Explicit allowlist: no snapshot strings, metadata or individual rows leave the server. */
export function projectPaSummary(input: unknown): PaPublicSummary {
  const source = z.object({ disponivel: z.boolean(), totais: z.unknown().optional(), meta: z.object({ fonte: z.unknown().optional() }).optional() }).parse(input);
  const demonstrativo = source.meta?.fonte === "mock";
  if (!source.disponivel) return { disponivel: false, demonstrativo, totais: { total: 0, aguardando: 0, emCurso: 0, finalizados: 0, foraSla: 0 }, riscos: [] };
  const totals = totalsSchema.parse(source.totais);
  const [aguardando = null, emCurso = null, finalizados = null] = protectSmallCounts([totals.aguardando, totals.emCurso, totals.finalizados]);
  const riskCounts = protectSmallCounts(PA_RISKS.map((cor) => totals.porCor[cor] ?? 0));
  return {
    disponivel: true, demonstrativo,
    totais: { total: totals.total, aguardando, emCurso, finalizados, foraSla: totals.foraSla },
    riscos: PA_RISKS.map((cor, i) => ({ cor, quantidade: riskCounts[i] ?? null })),
  };
}