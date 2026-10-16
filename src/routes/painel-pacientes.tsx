import { useState } from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AlertTriangle, Check, CheckCircle2, Info, Link2, Clock3, Hourglass, MonitorPlay, ShieldCheck, Stethoscope, Users } from "lucide-react";
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
    { name: "robots", content: "noindex, nofollow" },
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
const riskInfo: Record<CorRisco, { nome: string; texto: string }> = {
  Vermelho: { nome: "Emergência", texto: "Atendimento imediato" },
  Laranja: { nome: "Muito urgente", texto: "Atendimento prioritário" },
  Amarelo: { nome: "Urgente", texto: "Atendimento com prioridade" },
  Verde: { nome: "Pouco urgente", texto: "Atendimento por ordem de chegada" },
  Azul: { nome: "Não urgente", texto: "Pode aguardar com segurança" },
  Branco: { nome: "Orientação", texto: "Atendimento simples" },
  "Sem cor": { nome: "Ainda sem classificação", texto: "Aguardando avaliação da equipe" },
};
const horaSP = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

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
  return <button type="button" onClick={share} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground shadow-card hover:bg-accent">
    {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
    <span aria-live="polite">{copied ? "Link copiado" : "Copiar link para compartilhar"}</span>
  </button>;
}

function PaPage() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path === "/painel-pacientes/tv") return <Outlet />;
  return <PaOverview />;
}

function PaOverview() {
  const { data, isPending, isError } = usePaPublico();
  const header = <div className="flex min-w-0 flex-wrap items-start justify-between gap-3"><PageHeader title="Painel para pacientes" subtitle={`Maternidade em Foco · Pronto atendimento${data ? ` · atualizado às ${horaSP(data.atualizadoEm)}` : ""}`} /><div className="flex shrink-0 flex-wrap items-center gap-2"><ShareLink /><Link to="/painel-pacientes/tv" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground shadow-card hover:bg-accent"><MonitorPlay className="h-4 w-4" />Abrir na TV</Link></div></div>;
  if (isPending) return <PageSkeleton />;
  if (!data) return <div className="space-y-5">{header}<DataError /></div>;
  const pa = !data.aguardando ? data.pa : null;
  if (!pa?.disponivel) return <div className="space-y-5">{header}{isError && <DataError />}<div role="status" className="flex items-center gap-2 border-y border-border py-6 text-sm text-muted-foreground"><Clock3 className="h-4 w-4 shrink-0" />{data.aguardando ? "Aguardando o primeiro envio do PA" : "PA indisponível"}</div></div>;
  const t = pa.totais;
  const completedPercent = t.total > 0 && t.finalizados !== null ? Math.round(t.finalizados / t.total * 100) : null;
  const show = (n: number | null) => n === null ? "Poucas pessoas" : n;
  return <div className="min-w-0 space-y-6 md:space-y-8">
    {header}
    {isError && <DataError />}
    <div className="flex items-center gap-2 border-l-2 border-success bg-surface-positive px-3 py-3 text-xs font-semibold text-success-strong"><ShieldCheck className="h-4 w-4 shrink-0" />Página somente para visualização · Nenhum nome ou dado pessoal é mostrado</div>
    <section aria-label="Resumo do PA" className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {[{ label: "Pessoas no pronto atendimento", value: t.total, icon: Users, panel: "border-l-primary bg-card", tone: "text-foreground" },
        { label: "Aguardando atendimento", value: t.aguardando, icon: Hourglass, panel: "border-l-warning bg-surface-risk-orange", tone: "text-warning-strong" },
        { label: "Sendo atendidas agora", value: t.emCurso, icon: Stethoscope, panel: "border-l-cleaning bg-surface-risk-blue", tone: "text-cleaning-strong" },
        { label: "Já atendidas", value: t.finalizados, icon: CheckCircle2, panel: "border-l-success bg-surface-risk-green", tone: "text-success-strong" }].map((c) => (
        <article key={c.label} className={cn("min-w-0 rounded-md border border-l-8 p-4 shadow-card", c.panel)}>
          <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-xs font-semibold leading-5 text-muted-foreground">{c.label}</p><p className={cn("mt-1 font-extrabold tabular-nums", c.tone, c.value === null ? "text-xl" : "text-3xl")}>{show(c.value)}</p></div><c.icon className={cn("mt-1 h-5 w-5 shrink-0", c.tone)} /></div>
        </article>
      ))}

      <div className={cn("col-span-2 min-w-0 rounded-md border border-l-8 p-4 shadow-card sm:col-span-1", t.foraSla > 0 ? "border-critical bg-surface-risk-red" : "border-border bg-card")}>
        <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-xs font-semibold leading-5 text-muted-foreground">Esperando mais que o previsto</p><p className={cn("mt-1 text-3xl font-extrabold tabular-nums", t.foraSla > 0 ? "text-critical-strong" : "text-foreground")}>{t.foraSla}</p></div><AlertTriangle className={cn("mt-1 h-5 w-5 shrink-0", t.foraSla > 0 ? "text-critical-strong" : "text-muted-foreground")} /></div>
      </div>

    </section>
    {completedPercent !== null && <p className="-mt-2 text-sm text-muted-foreground">{completedPercent}% das pessoas desta atualização já foram atendidas.</p>}
    <section aria-labelledby="risk-title" className="min-w-0 space-y-4 border-t border-border pt-6">
      <h2 id="risk-title" className="text-lg font-bold">Atendimento por urgência</h2>
      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">As pessoas são atendidas pela <strong className="text-foreground">urgência do caso</strong>, não pela ordem de chegada. Quem está mais grave é atendido primeiro. Cada cor indica o nível de urgência definido pela equipe de saúde.</p>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{pa.riscos.map((risk) => <article key={risk.cor} className={cn("min-w-0 rounded-md border border-l-8 p-4 shadow-card", riskPanel[risk.cor])}>
        <h3 className="flex min-w-0 flex-wrap items-center gap-x-2 text-sm font-bold"><span className={cn("h-3 w-3 shrink-0 rounded-full", riskDot[risk.cor])} />{risk.cor}<span className="font-medium opacity-90">· {riskInfo[risk.cor].nome}</span></h3>
        <p className="mt-1 text-xs opacity-90">{riskInfo[risk.cor].texto}</p>
        <p className={cn("mt-3 font-extrabold tabular-nums", risk.quantidade === null ? "text-xl" : "text-3xl")}>{risk.quantidade === null ? "Poucas pessoas" : risk.quantidade}</p>
        <p className="mt-1 text-xs opacity-80">{risk.quantidade === null ? "Número oculto para proteger a privacidade" : risk.quantidade === 1 ? "pessoa" : "pessoas"}</p>
      </article>)}</div>
      <p className="text-xs leading-5 text-muted-foreground">Quando há de 1 a 4 pessoas em um grupo, o número não é mostrado, para que ninguém possa ser identificado.</p>
    </section>
    <section aria-label="Orientação" className="flex items-start gap-3 rounded-md border border-l-8 border-primary bg-card px-4 py-4 text-sm leading-6"><Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><p><strong>Se o seu estado piorar enquanto aguarda, avise imediatamente a equipe de classificação.</strong> O atendimento é feito pela gravidade do caso, não pela ordem de chegada.</p></section>
    <section aria-labelledby="attention-title" className="border-t border-border pt-6">
      <h2 id="attention-title" className="text-lg font-bold">Tempo de espera</h2>
      <div className={cn("mt-3 flex items-start gap-3 rounded-md border border-l-8 px-4 py-5", t.foraSla > 0 ? "border-warning bg-surface-risk-orange text-warning-strong" : "border-success bg-surface-risk-green text-success-strong")}>
        {t.foraSla > 0 ? <AlertTriangle className="mt-0.5 h-7 w-7 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0" />}
        <div className="min-w-0"><p className="text-lg font-extrabold leading-7">{t.foraSla > 0 ? `${t.foraSla} pessoas esperando mais do que o previsto` : "Tempos de espera dentro do previsto"}</p><p className="mt-1 text-sm leading-6">{t.foraSla > 0 ? "A equipe do pronto atendimento está priorizando esses casos." : "Ninguém está esperando além do tempo previsto para o seu nível de urgência."}</p></div>
      </div>
    </section>

  </div>;
}
