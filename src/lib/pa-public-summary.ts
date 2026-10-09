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
  totais: { total: number; aguardando: number; emCurso: number; finalizados: number; foraSla: number };
  riscos: { cor: (typeof PA_RISKS)[number]; quantidade: number | null }[];
};
export type PaPublicResult = { aguardando: true; atualizadoEm: string } | { aguardando: false; pa: PaPublicSummary; atualizadoEm: string };

/** Explicit allowlist: no snapshot strings, metadata or individual rows leave the server. */
export function projectPaSummary(input: unknown): PaPublicSummary {
  const source = z.object({ disponivel: z.boolean(), totais: z.unknown().optional(), meta: z.object({ fonte: z.unknown().optional() }).optional() }).parse(input);
  const demonstrativo = source.meta?.fonte === "mock";
  if (!source.disponivel) return { disponivel: false, demonstrativo, totais: { total: 0, aguardando: 0, emCurso: 0, finalizados: 0, foraSla: 0 }, riscos: [] };
  const totals = totalsSchema.parse(source.totais);
  return {
    disponivel: true, demonstrativo,
    totais: { total: totals.total, aguardando: totals.aguardando, emCurso: totals.emCurso, finalizados: totals.finalizados, foraSla: totals.foraSla },
    riscos: PA_RISKS.map((cor) => {
      const quantity = totals.porCor[cor] ?? 0;
      return { cor, quantidade: quantity > 0 && quantity < 5 ? null : quantity };
    }),
  };
}