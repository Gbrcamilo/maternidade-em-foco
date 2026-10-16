import { useState } from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AlertTriangle, Check, CheckCircle2, ChevronDown, ChevronRight, Clock3, Hourglass, Info, Link2, MonitorPlay, Pause, Play, ShieldCheck, Stethoscope, Timer, Users } from "lucide-react";
import { DataError, PageSkeleton, fmtEspera, setRefreshPaused, useRefreshPaused, usePaPublico } from "@/lib/use-painel";
import { Faq } from "@/components/faq";
import { PeopleRow, StackBar } from "@/components/people-icons";
import { RISKS, MAIN_RISKS } from "@/lib/risk-meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/painel-pacientes")({
  head: () => ({ meta: [
    { title: "Painel para pacientes — Maternidade em Foco" },
    { name: "description", content: "Indicadores agregados do pronto atendimento materno, sem identificação de pacientes." },
    { property: "og:title", content: "Painel para pacientes — Maternidade em Foco" },
    { property: "og:description", content: "Acompanhamento operacional do PA com totais e distribuição de risco, sem registros individuais." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: PaPage,
});

const horaSP = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
const pessoas = (n: number) => (n === 1 ? "pessoa" : "pessoas");

const PUBLIC_ORIGIN = "https://surgical-focus-dashboard.lovable.app";

/** Link somente de leitura: a página pública mostra apenas números agregados e não aceita login nem edição. */
function ShareLink() {
  const [copied, setCopied] = useState(false);
  const url = () => {
    const { origin, hostname } = window.location;
    const isPreview = hostname.includes("id-preview--") || hostname === "localhost";
    return `${isPreview ? PUBLIC_ORIGIN : origin}/painel-pacientes`;
  };
  const share = async () => {
    const link = url();
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      window.prompt("Copie o link abaixo:", link);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  return <button type="button" onClick={share} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-card hover:bg-accent sm:h-11 sm:w-auto">
    {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
    <span aria-live="polite">{copied ? "Link copiado" : "Copiar link"}</span>
  </button>;
}

function PaPage() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path === "/painel-pacientes/tv") return <Outlet />;
  return <PaOverview />;
}

function PaOverview() {
  const { data, isPending, isError } = usePaPublico();
  const paused = useRefreshPaused();
  const header = <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div className="min-w-0">
      <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary sm:text-xs"><Stethoscope className="h-3.5 w-3.5" />Pronto atendimento · Maternidade em Foco</p>
      <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl xl:text-5xl">Painel para pacientes</h1>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1.5 font-semibold text-success-strong"><span className="h-2 w-2 rounded-full bg-success" aria-hidden />{data ? `Atualizado às ${horaSP(data.atualizadoEm)}` : "Carregando"}</span><span aria-hidden>·</span><span>{paused ? "Atualização pausada" : "Atualiza a cada 15 segundos"}</span><button type="button" onClick={() => setRefreshPaused(!paused)} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-semibold text-foreground hover:bg-accent">{paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}{paused ? "Retomar" : "Pausar"}</button></p>
    </div>
    <div className="grid shrink-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center"><ShareLink /><Link to="/painel-pacientes/tv" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-card hover:bg-primary/90 sm:h-11 sm:w-auto"><MonitorPlay className="h-4 w-4" />Abrir na TV</Link></div>
  </div>;
  if (isPending) return <PageSkeleton />;
  if (!data) return <div className="space-y-5">{header}<DataError /></div>;
  const pa = !data.aguardando ? data.pa : null;
  if (!pa?.disponivel) return <div className="space-y-5">{header}{isError && <DataError />}<div role="status" className="flex items-center gap-2 border-y border-border py-6 text-sm text-muted-foreground"><Clock3 className="h-4 w-4 shrink-0" />{data.aguardando ? "Aguardando o primeiro envio do PA" : "PA indisponível"}</div></div>;

  const t = pa.totais;
  const wait = pa.espera;
  const delayed = t.foraSla > 0;
  const steps = [
    { label: "Aguardando", desc: "Esperando ser chamada", value: t.aguardando, icon: Hourglass, tone: "text-warning-strong", border: "border-warning", surface: "bg-surface-risk-orange", bar: "bg-warning" },
    { label: "Em atendimento", desc: "Sendo atendida agora", value: t.emCurso, icon: Stethoscope, tone: "text-cleaning-strong", border: "border-cleaning", surface: "bg-surface-risk-blue", bar: "bg-cleaning" },
    { label: "Já atendidas", desc: "Atendimento concluído", value: t.finalizados, icon: CheckCircle2, tone: "text-success-strong", border: "border-success", surface: "bg-surface-risk-green", bar: "bg-success" },
  ];
  const risks = pa.riscos.filter((r) => MAIN_RISKS.includes(r.cor) || r.quantidade === null || r.quantidade > 0);
  const riskTotal = pa.riscos.reduce((sum, r) => sum + (r.quantidade ?? 0), 0);
  const hasHidden = pa.riscos.some((r) => r.quantidade === null) || steps.some((s) => s.value === null);

  return <div className="min-w-0 space-y-6 md:space-y-8">
    {header}
    {isError && <div role="alert" className="flex items-center gap-2 rounded-xl border-2 border-warning bg-surface-warning p-4 text-sm font-semibold text-warning-strong"><AlertTriangle className="h-5 w-5 shrink-0" />Não foi possível atualizar agora. Os números abaixo podem estar desatualizados; tentando novamente.</div>}

    <div className={cn("flex items-center gap-4 rounded-2xl border-2 border-l-8 bg-card p-4 shadow-card sm:p-6", delayed ? "border-warning" : "border-success")}>
      {delayed ? <AlertTriangle className="h-10 w-10 shrink-0 text-warning-strong sm:h-14 sm:w-14" /> : <CheckCircle2 className="h-10 w-10 shrink-0 text-success-strong sm:h-14 sm:w-14" />}
      <div className="min-w-0">
        <p className={cn("text-xl font-extrabold leading-tight sm:text-2xl xl:text-3xl", delayed ? "text-warning-strong" : "text-success-strong")}>{delayed ? "Alguns atendimentos podem levar mais tempo" : "Atendimentos dentro do tempo previsto"}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground sm:text-base">{delayed ? `${t.foraSla} ${pessoas(t.foraSla)} esperando mais do que o previsto. A equipe está priorizando esses casos. Se precisar de ajuda, procure a recepção.` : "Ninguém está esperando além do tempo previsto para o seu nível de urgência."}</p>
      </div>
    </div>

    <section aria-labelledby="flow-title" className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="flow-title" className="text-xl font-bold sm:text-2xl">Como está o atendimento agora</h2>
        <p className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-sm font-semibold shadow-card"><Users className="h-4 w-4 text-primary" />{t.total} {pessoas(t.total)} no pronto atendimento</p>
      </div>
      <div className="flex flex-col items-stretch gap-2 md:flex-row md:gap-0">
        {steps.map((step, i) => (
          <div key={step.label} className="flex min-w-0 flex-1 flex-col items-stretch md:flex-row md:items-center">
            <article className={cn("min-w-0 flex-1 rounded-2xl border-2 border-t-8 p-4 shadow-card sm:p-5", step.border, step.surface)}>
              <div className="flex items-center justify-between gap-2">
                <p className={cn("flex items-center gap-2 text-base font-bold sm:text-lg", step.tone)}><step.icon className="h-6 w-6 shrink-0" /><span className="font-mono text-xs opacity-70">{i + 1}</span>{step.label}</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
              <p className={cn("mt-3 font-extrabold tabular-nums leading-none", step.tone, step.value === null ? "text-2xl" : "text-5xl sm:text-6xl")}>{step.value === null ? "Poucas pessoas" : step.value}</p>
              {step.value !== null && <p className="mt-1 text-sm font-medium text-muted-foreground">{pessoas(step.value)}</p>}
              {step.value !== null && <PeopleRow count={step.value} className={cn("mt-3", step.tone)} />}
            </article>
            {i < steps.length - 1 && (
              <span aria-hidden className="grid place-items-center py-1 text-muted-foreground md:px-1 md:py-0">
                <ChevronDown className="h-6 w-6 md:hidden" /><ChevronRight className="hidden h-7 w-7 md:block" />
              </span>
            )}
          </div>
        ))}
      </div>
      <StackBar label={`Proporção: ${steps.map((s) => `${s.label} ${s.value ?? 0}`).join(", ")}`} parts={steps.map((s) => ({ name: s.label, value: s.value ?? 0, className: s.bar }))} />
    </section>

    <section aria-labelledby="wait-title" className="min-w-0 space-y-4 border-t border-border pt-6">
      <div>
        <h2 id="wait-title" className="text-xl font-bold sm:text-2xl">Tempo de espera</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">Quanto tempo as pessoas que aguardam estão esperando agora, em comparação com o tempo previsto para cada nível de urgência.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <article className="col-span-2 rounded-2xl border-2 border-t-8 border-primary bg-card p-4 shadow-card sm:p-5 lg:col-span-1">
          <p className="flex items-center gap-2 text-sm font-bold text-primary"><Timer className="h-5 w-5 shrink-0" />Maior tempo de espera</p>
          <p className="mt-3 text-5xl font-extrabold leading-none tabular-nums text-foreground sm:text-6xl">{fmtEspera(wait.maiorMin)}</p>
          <p className="mt-2 text-xs font-medium text-muted-foreground">{wait.maiorMin === null ? "Ninguém aguardando no momento" : "de quem está esperando há mais tempo agora"}</p>
        </article>
        <article className="rounded-2xl border-2 border-t-8 border-border bg-card p-4 shadow-card sm:p-5">
          <p className="text-sm font-bold text-muted-foreground">Espera média</p>
          <p className="mt-3 text-4xl font-extrabold leading-none tabular-nums text-foreground sm:text-5xl">{fmtEspera(wait.mediaMin)}</p>
        </article>
        <article className="rounded-2xl border-2 border-t-8 border-border bg-card p-4 shadow-card sm:p-5">
          <p className="text-sm font-bold text-muted-foreground">Aguardando classificação</p>
          <p className="mt-3 text-4xl font-extrabold leading-none tabular-nums text-foreground sm:text-5xl">{wait.aguardandoClassificacao ?? "Poucas"}</p>
          <p className="mt-2 text-xs font-medium text-muted-foreground">{wait.aguardandoClassificacao === null ? "pessoas" : pessoas(wait.aguardandoClassificacao)}</p>
        </article>
        <article className="rounded-2xl border-2 border-t-8 border-border bg-card p-4 shadow-card sm:p-5">
          <p className="text-sm font-bold text-muted-foreground">Aguardando médico</p>
          <p className="mt-3 text-4xl font-extrabold leading-none tabular-nums text-foreground sm:text-5xl">{wait.aguardandoMedico ?? "Poucas"}</p>
          <p className="mt-2 text-xs font-medium text-muted-foreground">{wait.aguardandoMedico === null ? "pessoas" : pessoas(wait.aguardandoMedico)}</p>
        </article>
      </div>
      {wait.porCor.length > 0 && <ul className="space-y-3 rounded-2xl border-2 border-border bg-card p-4 shadow-card sm:p-5" aria-label="Espera por urgência">
        {wait.porCor.map((w) => {
          const info = RISKS[w.cor];
          const pct = w.maiorMin !== null && w.previstoMin ? Math.min(100, Math.round(w.maiorMin / w.previstoMin * 100)) : null;
          const over = w.maiorMin !== null && w.previstoMin !== null && w.maiorMin > w.previstoMin;
          return <li key={w.cor} className="space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <p className={cn("flex items-center gap-2 text-sm font-bold sm:text-base", info.tone)}><info.icon className="h-5 w-5 shrink-0" />{info.nome}<span className="text-xs font-medium text-muted-foreground">{w.aguardando === null ? "· poucas pessoas" : `· ${w.aguardando} ${pessoas(w.aguardando)}`}</span></p>
              <p className="text-sm font-semibold tabular-nums">{w.maiorMin === null ? "Maior espera não exibida" : <>Maior espera <span className={over ? "text-critical-strong" : undefined}>{fmtEspera(w.maiorMin)}</span></>}{w.previstoMin ? <span className="font-medium text-muted-foreground"> · previsto até {fmtEspera(w.previstoMin)}</span> : null}</p>
            </div>
            {pct !== null && <div role="img" aria-label={`${pct}% do tempo previsto`} className="h-3 w-full overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", over ? "bg-critical" : info.bar)} style={{ width: `${pct}%` }} /></div>}
          </li>;
        })}
      </ul>}
      <p className="text-xs leading-5 text-muted-foreground">Os tempos são uma informação do momento, não uma promessa de horário. Casos mais graves podem ser atendidos antes.</p>
    </section>

    <section aria-labelledby="risk-title" className="min-w-0 space-y-4 border-t border-border pt-6">
      <div>
        <h2 id="risk-title" className="text-xl font-bold sm:text-2xl">Atendimento por urgência</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">As pessoas são atendidas pela <strong className="text-foreground">gravidade do caso</strong>, não pela ordem de chegada. Cada cor mostra o nível de urgência definido pela equipe de saúde.</p>
      </div>
      <StackBar label="Distribuição por urgência" parts={pa.riscos.map((r) => ({ name: RISKS[r.cor].nome, value: r.quantidade ?? 0, className: RISKS[r.cor].bar }))} />
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {risks.map((risk) => {
          const info = RISKS[risk.cor];
          const share = risk.quantidade !== null && riskTotal > 0 ? Math.round(risk.quantidade / riskTotal * 100) : null;
          return <article key={risk.cor} className={cn("min-w-0 rounded-2xl border-2 border-t-8 p-4 shadow-card", info.border, info.surface)}>
            <h3 className={cn("flex items-center gap-2 text-base font-bold", info.tone)}><info.icon className="h-6 w-6 shrink-0" />{info.nome}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground"><span className="font-semibold">{risk.cor}</span> · {info.texto}</p>
            <p className={cn("mt-3 font-extrabold tabular-nums leading-none", info.tone, risk.quantidade === null ? "text-xl" : "text-5xl")}>{risk.quantidade === null ? "Poucas pessoas" : risk.quantidade}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">{risk.quantidade === null ? "Número oculto por privacidade" : `${pessoas(risk.quantidade)}${share !== null ? ` · ${share}% do total` : ""}`}</p>
            {risk.quantidade !== null && <PeopleRow count={risk.quantidade} max={8} className={cn("mt-3", info.tone)} />}
          </article>;
        })}
      </div>
      {hasHidden && <p className="text-xs leading-5 text-muted-foreground">Quando há de 1 a 4 pessoas em um grupo, o número não é mostrado, para que ninguém possa ser identificado.</p>}
    </section>

    <section aria-label="Orientação" className="flex items-start gap-3 rounded-2xl border-2 border-l-8 border-primary bg-card px-4 py-4 text-sm leading-6 shadow-card sm:text-base"><Info className="mt-0.5 h-6 w-6 shrink-0 text-primary" /><p><strong>Se o seu estado piorar enquanto aguarda, avise imediatamente a equipe de classificação.</strong> O atendimento é feito pela gravidade do caso, não pela ordem de chegada.</p></section>

    <Faq />

    <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-success-strong" />Página somente para visualização · Nenhum nome ou dado pessoal é mostrado</p>
  </div>;
}
