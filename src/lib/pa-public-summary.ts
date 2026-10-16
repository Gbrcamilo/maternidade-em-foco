import { z } from "zod";

export const PA_RISKS = ["Vermelho", "Laranja", "Amarelo", "Verde", "Azul", "Branco", "Sem cor"] as const;
type Risk = (typeof PA_RISKS)[number];
const count = z.number().int().min(0).max(1000000);
const totalsSchema = z.object({
  total: count, aguardando: count, emCurso: count, finalizados: count, foraSla: count,
  porCor: z.object(Object.fromEntries(PA_RISKS.map((risk) => [risk, count.optional()]))),
});
/** Only the numeric/enum fields needed for waiting-time statistics; names and identifiers are never parsed. */
const waitingRowSchema = z.object({
  grupo: z.literal("aguardando"),
  cor: z.enum(PA_RISKS),
  situacao: z.string().max(80).optional(),
  esperaClassifMin: z.number().min(0).max(100000).nullable().optional(),
  esperaAtendMin: z.number().min(0).max(100000).nullable().optional(),
  slaMin: z.number().min(0).max(100000).nullable().optional(),
});

/**
 * Owner decision about counts of 1 to 4 people.
 * `true` hides them (LGPD small-group protection); `false` shows exact numbers. Needs DPO approval to be `false`.
 */
export const SUPPRESS_SMALL_COUNTS = true;

export type PaWaitByRisk = { cor: Risk; aguardando: number | null; maiorMin: number | null; mediaMin: number | null; previstoMin: number | null };
export type PaWait = {
  aguardandoClassificacao: number | null;
  aguardandoMedico: number | null;
  /** Longest current wait among everyone waiting, in minutes. Aggregate only, no identity. */
  maiorMin: number | null;
  mediaMin: number | null;
  porCor: PaWaitByRisk[];
};

export type PaPublicSummary = {
  disponivel: boolean;
  demonstrativo: boolean;
  totais: { total: number; aguardando: number | null; emCurso: number | null; finalizados: number | null; foraSla: number };
  riscos: { cor: Risk; quantidade: number | null }[];
  espera: PaWait;
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

const EMPTY_WAIT: PaWait = { aguardandoClassificacao: 0, aguardandoMedico: 0, maiorMin: null, mediaMin: null, porCor: [] };

/** Waiting-time statistics, computed on the server from the waiting rows. Only aggregates leave this function. */
export function projectWait(rows: unknown, suppressSmall: boolean): PaWait {
  if (!Array.isArray(rows)) return EMPTY_WAIT;
  const waiting = rows.flatMap((row) => {
    const parsed = waitingRowSchema.safeParse(row);
    if (!parsed.success) return [];
    const r = parsed.data;
    const inTriage = /classific/i.test(r.situacao ?? "");
    const minutes = inTriage ? r.esperaClassifMin : r.esperaAtendMin;
    return [{ cor: r.cor, inTriage, minutes: typeof minutes === "number" ? Math.round(minutes) : null, sla: typeof r.slaMin === "number" ? r.slaMin : null }];
  });
  if (waiting.length === 0) return EMPTY_WAIT;
  const known = waiting.flatMap((w) => (w.minutes === null ? [] : [w.minutes]));
  const minGroup = suppressSmall ? 5 : 2;
  const hideSmall = (n: number): number | null => (suppressSmall && n > 0 && n < 5 ? null : n);
  const porCor = PA_RISKS.flatMap((cor): PaWaitByRisk[] => {
    const group = waiting.filter((w) => w.cor === cor);
    if (group.length === 0) return [];
    const mins = group.flatMap((w) => (w.minutes === null ? [] : [w.minutes]));
    const slas = group.flatMap((w) => (w.sla === null ? [] : [w.sla]));
    const enough = group.length >= minGroup && mins.length > 0;
    return [{
      cor,
      aguardando: hideSmall(group.length),
      maiorMin: enough ? Math.max(...mins) : null,
      mediaMin: enough ? Math.round(mins.reduce((a, b) => a + b, 0) / mins.length) : null,
      previstoMin: slas.length ? Math.max(...slas) : null,
    }];
  });
  return {
    aguardandoClassificacao: hideSmall(waiting.filter((w) => w.inTriage).length),
    aguardandoMedico: hideSmall(waiting.filter((w) => !w.inTriage).length),
    maiorMin: known.length ? Math.max(...known) : null,
    mediaMin: known.length ? Math.round(known.reduce((a, b) => a + b, 0) / known.length) : null,
    porCor,
  };
}

/** Explicit allowlist: no snapshot strings, metadata or individual rows leave the server. */
export function projectPaSummary(input: unknown, { suppressSmall = SUPPRESS_SMALL_COUNTS }: { suppressSmall?: boolean } = {}): PaPublicSummary {
  const source = z.object({ disponivel: z.boolean(), totais: z.unknown().optional(), pacientes: z.unknown().optional(), meta: z.object({ fonte: z.unknown().optional() }).optional() }).parse(input);
  const demonstrativo = source.meta?.fonte === "mock";
  if (!source.disponivel) return { disponivel: false, demonstrativo, totais: { total: 0, aguardando: 0, emCurso: 0, finalizados: 0, foraSla: 0 }, riscos: [], espera: EMPTY_WAIT };
  const totals = totalsSchema.parse(source.totais);
  const protect = (values: number[]): (number | null)[] => (suppressSmall ? protectSmallCounts(values) : values);
  const [aguardando = null, emCurso = null, finalizados = null] = protect([totals.aguardando, totals.emCurso, totals.finalizados]);
  const riskCounts = protect(PA_RISKS.map((cor) => totals.porCor[cor] ?? 0));
  return {
    disponivel: true, demonstrativo,
    totais: { total: totals.total, aguardando, emCurso, finalizados, foraSla: totals.foraSla },
    riscos: PA_RISKS.map((cor, i) => ({ cor, quantidade: riskCounts[i] ?? null })),
    espera: projectWait(source.pacientes, suppressSmall),
  };
}
