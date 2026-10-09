import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Hourglass, Maximize, Minimize, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { DataError, usePaPublico } from "@/lib/use-painel";
import { cn } from "@/lib/utils";
import type { CorRisco } from "@/lib/mock-data";

export const Route = createFileRoute("/painel-pacientes/tv")({
  head: () => ({ meta: [
    { title: "Painel TV — Maternidade em Foco" },
    { name: "description", content: "Painel de sala de espera do pronto atendimento materno, com indicadores agregados e sem identificação de pacientes." },
    { name: "robots", content: "noindex" },
  ] }),
  component: TvPage,
});

const riskDot: Record<CorRisco, string> = {
  Vermelho: "bg-critical", Laranja: "bg-warning", Amarelo: "bg-caution", Verde: "bg-success",
  Azul: "bg-cleaning", Branco: "bg-card border-2 border-border", "Sem cor": "bg-muted-foreground",
};

const riskPanel: Record<CorRisco, string> = {
  Vermelho: "border-critical bg-surface-risk-red text-critical-strong",
  Laranja: "border-warning bg-surface-risk-orange text-warning-strong",
  Amarelo: "border-caution bg-surface-risk-yellow text-caution-strong",
  Verde: "border-success bg-surface-risk-green text-success-strong",
  Azul: "border-cleaning bg-surface-risk-blue text-cleaning-strong",
  Branco: "border-border bg-surface-risk-white text-foreground",
  "Sem cor": "border-muted-foreground bg-surface-risk-grey text-muted-foreground",
};

const horaSP = (d: Date | string) => new Date(d).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function TvPage() {
  const { data, isPending, isError } = usePaPublico();
  const now = useClock();
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };

  const pa = data && !data.aguardando ? data.pa : null;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 xl:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"><Stethoscope className="h-6 w-6" /></span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold xl:text-2xl">Maternidade em Foco</h1>
            <p className="text-sm text-muted-foreground">Pronto atendimento · Painel da sala de espera</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right">
            <p className="font-mono text-3xl font-bold tabular-nums xl:text-4xl">{horaSP(now)}</p>
            {data && <p className="text-xs text-muted-foreground">Dados atualizados às {horaSP(data.atualizadoEm)}</p>}
          </div>
          <button onClick={toggleFullscreen} aria-label={fullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"} title={fullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"} className="grid h-11 w-11 place-items-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground">
            {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-5 px-6 py-5 xl:gap-7 xl:px-10">
        {isPending && <p role="status" className="py-20 text-center text-lg text-muted-foreground">Carregando…</p>}
        {!isPending && (!data || isError) && <DataError />}
        {data && !isError && (!pa || !pa.disponivel) && (
          <div role="status" className="flex items-center justify-center gap-3 py-20 text-lg text-muted-foreground">
            <Clock3 className="h-6 w-6 shrink-0" />{data.aguardando ? "Aguardando o primeiro envio do PA" : "PA indisponível"}
          </div>
        )}
        {data && !isError && pa?.disponivel && (() => {
          const t = pa.totais;
          const cards = [
            { label: "Aguardando", value: t.aguardando, icon: Hourglass, panel: "border-l-warning bg-surface-risk-orange", tone: "text-warning-strong" },
            { label: "Em atendimento", value: t.emCurso, icon: Stethoscope, panel: "border-l-cleaning bg-surface-risk-blue", tone: "text-cleaning-strong" },
            { label: "Finalizados", value: t.finalizados, icon: CheckCircle2, panel: "border-l-success bg-surface-risk-green", tone: "text-success-strong" },
            { label: "Total de pacientes", value: t.total, icon: Users, panel: "border-l-primary bg-card", tone: "text-foreground" },
          ];
          return (
            <>
              <section aria-label="Resumo do atendimento" className="grid grid-cols-2 gap-4 xl:grid-cols-4 xl:gap-6">
                {cards.map((c) => (
                  <article key={c.label} className={cn("rounded-lg border border-border border-l-8 p-5 shadow-card xl:p-7", c.panel)}>
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground xl:text-lg"><c.icon className={cn("h-5 w-5 shrink-0 xl:h-6 xl:w-6", c.tone)} />{c.label}</div>
                    <p className={cn("mt-3 font-extrabold tabular-nums", c.tone, "text-6xl xl:text-7xl")}>{c.value}</p>
                  </article>
                ))}
              </section>

              <div className={cn("flex items-center gap-4 rounded-xl border-2 px-5 py-5 xl:px-8 xl:py-6", t.foraSla > 0 ? "border-warning bg-surface-risk-orange text-warning-strong" : "border-success bg-surface-risk-green text-success-strong")}>
                {t.foraSla > 0
                  ? <AlertTriangle className="h-9 w-9 shrink-0 xl:h-12 xl:w-12" />
                  : <CheckCircle2 className="h-9 w-9 shrink-0 xl:h-12 xl:w-12" />}
                <div className="min-w-0">
                  <p className="text-2xl font-extrabold leading-tight xl:text-4xl">
                    {t.foraSla > 0 ? `${t.foraSla} pacientes com tempo de espera acima do previsto` : "Tempos de espera dentro do previsto"}
                  </p>
                  <p className="mt-1 text-base leading-6 xl:text-lg">
                    {t.foraSla > 0
                      ? "A equipe do pronto atendimento está priorizando esses casos."
                      : "Nenhum paciente acima do tempo previsto para a classificação de risco informada."}
                  </p>
                </div>
              </div>

              <section aria-label="Distribuição por risco" className="rounded-lg border border-border bg-card p-5 shadow-card xl:p-7">
                <h2 className="text-lg font-bold xl:text-2xl">Distribuição por classificação de risco</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7 xl:gap-4">
                  {pa.riscos.map((r) => (
                    <div key={r.cor} className={cn("min-w-0 rounded-md border border-l-8 p-4", riskPanel[r.cor])}>
                      <p className="flex items-center gap-2 text-sm font-bold xl:text-lg"><span className={cn("h-3.5 w-3.5 shrink-0 rounded-full", riskDot[r.cor])} />{r.cor}</p>
                      <p className={cn("mt-2 font-extrabold tabular-nums", r.quantidade === null ? "text-base opacity-80" : "text-5xl xl:text-6xl")}>{r.quantidade === null ? "Protegido" : r.quantidade}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Contagens de 1 a 4 por risco são protegidas para reduzir a identificação de grupos pequenos.</p>
              </section>
            </>
          );
        })()}
      </main>

      <footer className="flex items-center justify-between gap-4 border-t border-border px-6 py-3 text-xs text-muted-foreground xl:px-10">
        <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-success" />Visão agregada · Sem identificação de pacientes</span>
        <Link to="/painel-pacientes" className="underline-offset-4 hover:underline">Sair do modo TV</Link>
      </footer>
    </div>
  );
}
