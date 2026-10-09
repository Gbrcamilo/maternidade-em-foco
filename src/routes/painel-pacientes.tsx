import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Clock3, Hourglass, MonitorPlay, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { MetricCard } from "@/components/dashboard-ui";
import { DataError, PageSkeleton, usePaPublico } from "@/lib/use-painel";

import { cn } from "@/lib/utils";
import type { CorRisco } from "@/lib/mock-data";

export const Route = createFileRoute("/painel-pacientes")({
  head: () => ({ meta: [
    { title: "Painel para pacientes — Maternidade em Foco" },
    { name: "description", content: "Indicadores agregados do pronto atendimento materno, sem identificação de pacientes." },
    { property: "og:title", content: "Painel para pacientes — Maternidade em Foco" },
    { property: "og:description", content: "Acompanhamento operacional do PA com totais e distribuição de risco, sem registros individuais." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: PaPage,
});

const riskTone: Record<CorRisco, string> = {
  Vermelho: "border-l-critical", Laranja: "border-l-warning", Amarelo: "border-l-caution",
  Verde: "border-l-success", Azul: "border-l-cleaning", Branco: "border-l-border", "Sem cor": "border-l-muted-foreground",
};
const riskDot: Record<CorRisco, string> = {
  Vermelho: "bg-critical", Laranja: "bg-warning", Amarelo: "bg-caution", Verde: "bg-success",
  Azul: "bg-cleaning", Branco: "bg-card border border-border", "Sem cor": "bg-muted-foreground",
};
const horaSP = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

function PaPage() {
  return <PaOverview />;
}

function PaOverview() {
  const { data, isPending, isError } = usePaPublico();
  const header = <div className="flex min-w-0 flex-wrap items-start justify-between gap-3"><PageHeader title="Painel para pacientes" subtitle={`Maternidade em Foco · Pronto atendimento${data ? ` · atualizado às ${horaSP(data.atualizadoEm)}` : ""}`} /><Link to="/painel-pacientes/tv" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground shadow-card hover:bg-accent"><MonitorPlay className="h-4 w-4" />Abrir na TV</Link></div>;
  if (isPending) return <PageSkeleton />;
  if (!data) return <div className="space-y-5">{header}<DataError /></div>;
  const pa = !data.aguardando ? data.pa : null;
  if (!pa?.disponivel) return <div className="space-y-5">{header}{isError && <DataError />}<div role="status" className="flex items-center gap-2 border-y border-border py-6 text-sm text-muted-foreground"><Clock3 className="h-4 w-4 shrink-0" />{data.aguardando ? "Aguardando o primeiro envio do PA" : "PA indisponível"}</div></div>;
  const t = pa.totais;
  const completedPercent = t.total > 0 ? Math.round(t.finalizados / t.total * 100) : 0;
  return <div className="min-w-0 space-y-6 md:space-y-8">
    {header}
    {isError && <DataError />}
    <div className="flex items-center gap-2 border-l-2 border-success bg-surface-positive px-3 py-3 text-xs font-semibold text-success-strong"><ShieldCheck className="h-4 w-4 shrink-0" />Visão agregada · Sem identificação de pacientes</div>
    <section aria-label="Resumo do PA" className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <MetricCard label="Total de pacientes" value={t.total} icon={Users} />
      <MetricCard label="Aguardando" value={t.aguardando} icon={Hourglass} tone="warn" />
      <MetricCard label="Em curso" value={t.emCurso} icon={Stethoscope} />
      <MetricCard label="Finalizados" value={t.finalizados} icon={CheckCircle2} tone="good" />
      <div className={cn("col-span-2 min-w-0 rounded-md border bg-card p-4 shadow-card sm:col-span-1", t.foraSla > 0 ? "border-critical bg-critical/5" : "border-border")}>
        <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-xs font-semibold leading-5 text-muted-foreground">Fora do SLA</p><p className={cn("mt-1 text-3xl font-bold tabular-nums", t.foraSla > 0 ? "text-critical" : "text-foreground")}>{t.foraSla}</p></div><AlertTriangle className={cn("mt-1 h-5 w-5 shrink-0", t.foraSla > 0 ? "text-critical" : "text-muted-foreground")} /></div>
      </div>
    </section>
    <section aria-labelledby="flow-title" className="min-w-0 space-y-4">
      <h2 id="flow-title" className="text-lg font-bold">Fluxo do atendimento</h2>
      <div className="grid min-w-0 gap-4 md:grid-cols-3">
        {[{ label: "Aguardando", count: t.aguardando, tone: "bg-warning", icon: Hourglass }, { label: "Em curso", count: t.emCurso, tone: "bg-cleaning", icon: Stethoscope }, { label: "Finalizados", count: t.finalizados, tone: "bg-success", icon: CheckCircle2 }].map((stage, i) => <article key={stage.label} className="min-w-0 border-t border-border pt-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><span className="font-mono text-xs text-muted-foreground">0{i + 1}</span><stage.icon className="h-4 w-4 text-muted-foreground" />{stage.label}</div>
          <div className="mt-3 flex items-baseline justify-between gap-2"><span className="text-4xl font-bold tabular-nums">{stage.count}</span><span className="text-xs text-muted-foreground">pacientes</span></div>
          <div className="mt-3 flex h-2 overflow-hidden rounded bg-muted" role="meter" aria-label={stage.label} aria-valuemin={0} aria-valuemax={Math.max(t.total, stage.count, 1)} aria-valuenow={stage.count}><div className={stage.tone} style={{ width: `${t.total > 0 ? Math.min(100, stage.count / t.total * 100) : 0}%` }} /></div>
        </article>)}
      </div>
      <p className="text-xs text-muted-foreground">{completedPercent}% dos pacientes do envio atual estão finalizados.</p>
    </section>
    <section aria-labelledby="risk-title" className="min-w-0 space-y-4 border-t border-border pt-6">
      <h2 id="risk-title" className="text-lg font-bold">Distribuição por risco</h2>
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{pa.riscos.map((risk) => <article key={risk.cor} className={cn("min-w-0 rounded-md border border-l-4 border-border bg-card p-4 shadow-card", riskTone[risk.cor])}>
        <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold"><span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", riskDot[risk.cor])} />{risk.cor}</h3>
        <p className={cn("mt-3 font-bold tabular-nums", risk.quantidade === null ? "text-base text-muted-foreground" : "text-3xl")}>{risk.quantidade === null ? "Protegido" : risk.quantidade}</p>
        <p className="mt-1 text-xs text-muted-foreground">{risk.quantidade === null ? "Grupo pequeno" : "pacientes"}</p>
      </article>)}</div>
      <p className="text-xs leading-5 text-muted-foreground">Contagens de 1 a 4 por risco são protegidas para reduzir a identificação de grupos pequenos.</p>
    </section>
    <section aria-labelledby="attention-title" className="border-t border-border pt-6">
      <h2 id="attention-title" className="text-lg font-bold">Atenção operacional</h2>
      <div className={cn("mt-3 flex items-start gap-3 border-l-2 px-4 py-4", t.foraSla > 0 ? "border-warning bg-surface-warning text-warning-strong" : "border-success bg-surface-positive text-success-strong")}>
        {t.foraSla > 0 ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}
        <div className="min-w-0"><p className="text-sm font-bold">{t.foraSla > 0 ? `${t.foraSla} pacientes fora do SLA` : "Nenhum atraso de SLA informado"}</p><p className="mt-1 text-xs leading-5">{t.foraSla > 0 ? "Revisar a capacidade e o fluxo de atendimento com a coordenação." : "Situação conforme o último envio do PA."}</p></div>
      </div>
    </section>
  </div>;
}
