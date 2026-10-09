import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Clock3, Hourglass, MonitorPlay, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
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

const riskPanel: Record<CorRisco, string> = {
  Vermelho: "border-critical bg-surface-risk-red text-critical-strong",
  Laranja: "border-warning bg-surface-risk-orange text-warning-strong",
  Amarelo: "border-caution bg-surface-risk-yellow text-caution-strong",
  Verde: "border-success bg-surface-risk-green text-success-strong",
  Azul: "border-cleaning bg-surface-risk-blue text-cleaning-strong",
  Branco: "border-border bg-surface-risk-white text-foreground",
  "Sem cor": "border-muted-foreground bg-surface-risk-grey text-muted-foreground",
};

const riskDot: Record<CorRisco, string> = {
  Vermelho: "bg-critical", Laranja: "bg-warning", Amarelo: "bg-caution", Verde: "bg-success",
  Azul: "bg-cleaning", Branco: "bg-card border border-border", "Sem cor": "bg-muted-foreground",
};
const horaSP = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

function PaPage() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path === "/painel-pacientes/tv") return <Outlet />;
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
      {[{ label: "Total de pacientes", value: t.total, icon: Users, panel: "border-l-primary bg-card", tone: "text-foreground" },
        { label: "Aguardando", value: t.aguardando, icon: Hourglass, panel: "border-l-warning bg-surface-risk-orange", tone: "text-warning-strong" },
        { label: "Em curso", value: t.emCurso, icon: Stethoscope, panel: "border-l-cleaning bg-surface-risk-blue", tone: "text-cleaning-strong" },
        { label: "Finalizados", value: t.finalizados, icon: CheckCircle2, panel: "border-l-success bg-surface-risk-green", tone: "text-success-strong" }].map((c) => (
        <article key={c.label} className={cn("min-w-0 rounded-md border border-l-8 p-4 shadow-card", c.panel)}>
          <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-xs font-semibold leading-5 text-muted-foreground">{c.label}</p><p className={cn("mt-1 text-3xl font-extrabold tabular-nums", c.tone)}>{c.value}</p></div><c.icon className={cn("mt-1 h-5 w-5 shrink-0", c.tone)} /></div>
        </article>
      ))}

      <div className={cn("col-span-2 min-w-0 rounded-md border border-l-8 p-4 shadow-card sm:col-span-1", t.foraSla > 0 ? "border-critical bg-surface-risk-red" : "border-border bg-card")}>
        <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-xs font-semibold leading-5 text-muted-foreground">Fora do SLA</p><p className={cn("mt-1 text-3xl font-extrabold tabular-nums", t.foraSla > 0 ? "text-critical-strong" : "text-foreground")}>{t.foraSla}</p></div><AlertTriangle className={cn("mt-1 h-5 w-5 shrink-0", t.foraSla > 0 ? "text-critical-strong" : "text-muted-foreground")} /></div>
      </div>

    </section>
    <section aria-labelledby="flow-title" className="min-w-0 space-y-4">
      <h2 id="flow-title" className="text-lg font-bold">Fluxo do atendimento</h2>
      <div className="grid min-w-0 gap-4 md:grid-cols-3">
        {[{ label: "Aguardando", count: t.aguardando, tone: "bg-warning", panel: "border-l-warning bg-surface-risk-orange text-warning-strong", icon: Hourglass }, { label: "Em curso", count: t.emCurso, tone: "bg-cleaning", panel: "border-l-cleaning bg-surface-risk-blue text-cleaning-strong", icon: Stethoscope }, { label: "Finalizados", count: t.finalizados, tone: "bg-success", panel: "border-l-success bg-surface-risk-green text-success-strong", icon: CheckCircle2 }].map((stage, i) => <article key={stage.label} className={cn("min-w-0 rounded-md border border-l-8 p-4 shadow-card", stage.panel)}>
          <div className="flex items-center gap-2 text-sm font-bold"><span className="font-mono text-xs opacity-80">0{i + 1}</span><stage.icon className="h-4 w-4 shrink-0" />{stage.label}</div>
          <div className="mt-3 flex items-baseline justify-between gap-2"><span className="text-4xl font-extrabold tabular-nums">{stage.count}</span><span className="text-xs">pacientes</span></div>
          <div className="mt-3 flex h-3 overflow-hidden rounded bg-background/70" role="meter" aria-label={stage.label} aria-valuemin={0} aria-valuemax={Math.max(t.total, stage.count, 1)} aria-valuenow={stage.count}><div className={stage.tone} style={{ width: `${t.total > 0 ? Math.min(100, stage.count / t.total * 100) : 0}%` }} /></div>
        </article>)}

      </div>
      <p className="text-xs text-muted-foreground">{completedPercent}% dos pacientes do envio atual estão finalizados.</p>
    </section>
    <section aria-labelledby="risk-title" className="min-w-0 space-y-4 border-t border-border pt-6">
      <h2 id="risk-title" className="text-lg font-bold">Distribuição por risco</h2>
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{pa.riscos.map((risk) => <article key={risk.cor} className={cn("min-w-0 rounded-md border border-l-8 p-4 shadow-card", riskPanel[risk.cor])}>
        <h3 className="flex min-w-0 items-center gap-2 text-sm font-bold"><span className={cn("h-3 w-3 shrink-0 rounded-full", riskDot[risk.cor])} />{risk.cor}</h3>
        <p className={cn("mt-3 font-extrabold tabular-nums", risk.quantidade === null ? "text-base opacity-80" : "text-3xl")}>{risk.quantidade === null ? "Protegido" : risk.quantidade}</p>
        <p className="mt-1 text-xs opacity-80">{risk.quantidade === null ? "Grupo pequeno" : "pacientes"}</p>
      </article>)}</div>

      <p className="text-xs leading-5 text-muted-foreground">Contagens de 1 a 4 por risco são protegidas para reduzir a identificação de grupos pequenos.</p>
    </section>
    <section aria-labelledby="attention-title" className="border-t border-border pt-6">
      <h2 id="attention-title" className="text-lg font-bold">Tempo de espera</h2>
      <div className={cn("mt-3 flex items-start gap-3 rounded-md border border-l-8 px-4 py-5", t.foraSla > 0 ? "border-warning bg-surface-risk-orange text-warning-strong" : "border-success bg-surface-risk-green text-success-strong")}>
        {t.foraSla > 0 ? <AlertTriangle className="mt-0.5 h-7 w-7 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0" />}
        <div className="min-w-0"><p className="text-lg font-extrabold leading-7">{t.foraSla > 0 ? `${t.foraSla} pacientes com tempo de espera acima do previsto` : "Tempos de espera dentro do previsto"}</p><p className="mt-1 text-sm leading-6">{t.foraSla > 0 ? "A equipe do pronto atendimento está priorizando esses casos." : "Nenhum paciente acima do tempo previsto para a classificação de risco informada."}</p></div>
      </div>
    </section>

  </div>;
}
