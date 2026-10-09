import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Activity, AlertTriangle, Check, ChevronDown, Copy, LoaderCircle, Plus, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { analyzePa } from "@/lib/pa-analysis.functions";
import { aggregateSchema, type PaAggregates, type AnalysisResult } from "@/lib/pa-analysis-schema";
import { cn } from "@/lib/utils";

const metrics = [
  ["aguardandoClassificacao", "Aguardando classificação", "pacientes"],
  ["aguardandoMedico", "Aguardando médico", "pacientes"],
  ["emAtendimento", "Em atendimento", "pacientes"],
  ["finalizados", "Finalizados no período", "pacientes"],
  ["foraSla", "Fora do SLA na fila para médico", "pacientes"],
  ["esperaMediaClassificacaoMin", "Espera média p/ classificação", "min"],
  ["esperaMediaMedicoMin", "Espera média p/ médico", "min"],
  ["maiorEsperaMedicoMin", "Maior espera p/ médico", "min"],
  ["medicosDisponiveis", "Médicos disponíveis", "profissionais"],
  ["classificadoresDisponiveis", "Profissionais na classificação", "profissionais"],
] as const;
const risks = ["Vermelho", "Laranja", "Amarelo", "Verde", "Azul", "Branco", "Sem cor"] as const;
const dots = ["bg-critical", "bg-warning", "bg-caution", "bg-success", "bg-cleaning", "bg-card border border-border", "bg-muted-foreground"];

export function PaAnalysis() {
  const callAnalysis = useServerFn(analyzePa);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({ periodoMin: "60" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const update = (key: string, value: string) => { setValues((v) => ({ ...v, [key]: value })); setErrors({}); setResult(null); setCopied(false); };
  const countForRisk = risks.reduce((total, risk) => total + Number(values[`risco-${risk}`] || 0), 0);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numbers = Object.fromEntries(metrics.map(([key]) => [key, values[key] === undefined || values[key] === "" ? NaN : Number(values[key])]));
    const parsed = aggregateSchema.safeParse({ ...numbers, periodoMin: Number(values.periodoMin), porRisco: Object.fromEntries(risks.map((risk) => [risk, values[`risco-${risk}`] === undefined || values[`risco-${risk}`] === "" ? NaN : Number(values[`risco-${risk}`])])) });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join("."), issue.message.includes("nan") ? "Informe um número, inclusive zero." : issue.message])));
      return;
    }
    setPending(true); setResult(null); setCopied(false);
    try { setResult(await callAnalysis({ data: parsed.data as PaAggregates })); }
    catch { setResult({ ok: false, status: 500, message: "Não foi possível concluir a análise. Os dados informados foram preservados." }); }
    finally { setPending(false); }
  };
  const copySummary = async () => {
    if (!result?.ok) return;
    const r = result.resumo;
    const text = ["Resumo operacional do PA", r.resumo, ...r.gargalos.map((g) => `${g.titulo}\n${g.evidencia}\nAção sugerida: ${g.acao}`), "Prioridades", ...r.prioridades, `Limitações: ${r.limitacoes}`, "Análise por IA — validar com a coordenação."].join("\n\n");
    try { await navigator.clipboard.writeText(text); setCopied(true); } catch { setCopied(false); }
  };
  return <section className="mt-7 min-w-0 border-t border-border pt-6" aria-labelledby="analysis-title">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></span><div className="min-w-0"><h2 id="analysis-title" className="text-lg font-bold">Resumo operacional por IA</h2><p className="mt-1 text-xs text-muted-foreground">Dados agregados da coordenação</p></div></div>
      <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="analysis-content" aria-label={open ? "Recolher análise operacional" : "Abrir análise operacional"} title={open ? "Recolher análise operacional" : "Abrir análise operacional"}>{open ? <ChevronDown className="h-4 w-4 rotate-180" /> : <Plus className="h-4 w-4" />}</Button>
    </div>
    {open && <div id="analysis-content" className="mt-5 grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form onSubmit={submit} className="min-w-0 space-y-5" noValidate>
        <div className="flex items-start gap-2 border-l-2 border-primary bg-primary/5 px-3 py-3 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p>Somente totais e tempos. Não inclua informações individuais. A análise é uma sugestão operacional, não uma decisão clínica.</p></div>
        <fieldset disabled={pending} className="min-w-0 space-y-5 disabled:opacity-60">
          <label className="block max-w-xs text-xs font-semibold text-muted-foreground">Período dos finalizados<select value={values.periodoMin} onChange={(e) => update("periodoMin", e.target.value)} className="select-field mt-1.5 block h-11 w-full"><option value="30">Últimos 30 minutos</option><option value="60">Última hora</option><option value="240">Últimas 4 horas</option><option value="720">Últimas 12 horas</option><option value="1440">Últimas 24 horas</option></select></label>
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">{metrics.map(([key, label, unit]) => <label key={key} className="min-w-0 text-xs font-semibold text-muted-foreground">{label}<span className="relative mt-1.5 block"><Input type="number" min={0} max={key.includes("Min") ? 1440 : key.includes("Disponiveis") ? 1000 : 10000} step={key.includes("Min") ? "any" : "1"} inputMode="decimal" value={values[key] ?? ""} onChange={(e) => update(key, e.target.value)} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `error-${key}` : undefined} className={cn("h-11 bg-card pr-24", errors[key] && "border-critical")} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-normal">{unit}</span></span>{errors[key] && <span id={`error-${key}`} className="mt-1 block text-critical">{errors[key]}</span>}</label>)}</div>
          <fieldset className="min-w-0 border-t border-border pt-4"><legend className="text-sm font-semibold text-foreground">Fila aguardando médico por risco</legend><div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">{risks.map((risk, i) => <label key={risk} className="text-xs font-semibold text-muted-foreground"><span className="inline-flex items-center gap-1.5"><span className={cn("h-2 w-2 rounded-full", dots[i])} />{risk}</span><Input type="number" min={0} max={10000} step="1" inputMode="numeric" value={values[`risco-${risk}`] ?? ""} onChange={(e) => update(`risco-${risk}`, e.target.value)} aria-invalid={!!errors[`porRisco.${risk}`]} className="mt-1.5 h-11 bg-card" />{errors[`porRisco.${risk}`] && <span className="mt-1 block text-critical">Informe uma quantidade válida.</span>}</label>)}</div><p className="mt-3 text-xs text-muted-foreground">Total por risco: <strong className="tabular-nums text-foreground">{countForRisk}</strong> / {values.aguardandoMedico || "—"} aguardando médico</p>{errors.porRisco && <p role="alert" className="mt-1 text-xs text-critical">{errors.porRisco}</p>}</fieldset>
        </fieldset>
        {Object.keys(errors).length > 0 && <p role="alert" className="text-xs font-semibold text-critical">Revise os campos indicados antes de gerar o resumo.</p>}
        <div className="flex flex-wrap gap-2"><Button type="submit" variant="primary" disabled={pending} className="h-11 flex-1 sm:flex-none">{pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{pending ? "Gerando resumo…" : "Gerar resumo operacional"}</Button><Button type="button" variant="ghost" disabled={pending} size="icon" className="h-11 w-11" onClick={() => { setValues({ periodoMin: "60" }); setErrors({}); setResult(null); }} aria-label="Limpar dados agregados" title="Limpar dados agregados"><RotateCcw className="h-4 w-4" /></Button></div>
        <p className="text-xs leading-5 text-muted-foreground">Lovable AI · Consome créditos de IA por análise. Os dados informados não alteram a fila de pacientes.</p>
      </form>
      <div className="min-w-0" aria-live="polite" aria-busy={pending}>
        {pending && <div role="status" className="flex items-center gap-3 border-y border-border py-6 text-sm text-muted-foreground"><LoaderCircle className="h-5 w-5 animate-spin" />Analisando os dados agregados…</div>}
        {!pending && !result && <div className="flex min-h-40 flex-col items-center justify-center gap-3 border-y border-border py-6 text-center"><Activity className="h-7 w-7 text-primary" /><p className="text-sm font-semibold text-muted-foreground">Nenhuma análise gerada</p></div>}
        {result && !result.ok && <div role="alert" className="flex items-start gap-2 rounded-md border border-warning bg-surface-warning p-4 text-sm text-warning-strong"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><p className="break-words">{result.message}</p></div>}
        {result?.ok && <div className="space-y-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3"><div><span className={cn("inline-flex rounded px-2 py-1 text-xs font-semibold", result.resumo.nivel === "critico" ? "bg-critical/10 text-critical" : result.resumo.nivel === "atencao" ? "bg-surface-warning text-warning-strong" : "bg-surface-positive text-success-strong")}>{result.resumo.nivel === "critico" ? "Situação crítica" : result.resumo.nivel === "atencao" ? "Atenção operacional" : "Situação estável"}</span><p className="mt-2 text-xs text-muted-foreground">Gerado às {new Date(result.geradoEm).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })}</p></div><Button variant="outline" size="icon" className="h-11 w-11" onClick={copySummary} aria-label={copied ? "Resumo copiado" : "Copiar resumo"} title={copied ? "Resumo copiado" : "Copiar resumo"}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button></div>
          <p className="break-words text-sm leading-6">{result.resumo.resumo}</p>
          <div className="space-y-3"><h3 className="text-sm font-bold">Gargalos identificados</h3>{result.resumo.gargalos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum gargalo identificado nos dados informados.</p> : result.resumo.gargalos.slice(0, 3).map((g, i) => <article key={i} className="rounded-md border border-border bg-card p-4"><h4 className="break-words text-sm font-bold">{g.titulo}</h4><p className="mt-2 break-words text-xs leading-5 text-muted-foreground">{g.evidencia}</p><p className="mt-3 break-words text-sm leading-6"><span className="font-semibold text-primary">Ação sugerida: </span>{g.acao}</p></article>)}</div>
          <div className="border-t border-border pt-4"><h3 className="text-sm font-bold">Prioridades operacionais</h3><ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6">{result.resumo.prioridades.slice(0, 3).map((p, i) => <li key={i} className="break-words">{p}</li>)}</ol></div>
          <p className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground"><strong>Limitações: </strong>{result.resumo.limitacoes}</p>
          <p className="text-xs font-semibold text-muted-foreground">Análise por IA · Validar com a coordenação.</p>
        </div>}
      </div>
    </div>}
  </section>;
}