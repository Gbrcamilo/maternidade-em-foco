import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import { AlertTriangle, CheckCircle2, Hourglass, Info, Leaf, ShieldCheck, Siren, Stethoscope, WifiOff, Wifi } from "lucide-react";
import { PartnerLogos, CREDIT_TI } from "@/components/partner-logos";
import { usePaPublico, useAge, fmtEspera } from "@/lib/use-painel";
import { cn } from "@/lib/utils";
import type { CorRisco } from "@/lib/mock-data";

export const Route = createFileRoute("/painel-pacientes/tv")({
  head: () => ({ meta: [
    { title: "Pronto atendimento agora — Maternidade em Foco" },
    { name: "description", content: "Painel de sala de espera do pronto atendimento materno, com indicadores agregados e sem identificação de pacientes." },
    { name: "robots", content: "noindex, nofollow" },
    { property: "og:title", content: "Pronto atendimento agora — Maternidade em Foco" },
    { property: "og:description", content: "Indicadores agregados do PA para sala de espera, sem identificação de pacientes." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: TvPage,
});

/** Após este tempo sem dados novos, os números são ocultados para não induzir ao erro. */
const MAX_DATA_AGE_S = 10 * 60;
/** Acima deste tempo sem dados novos, avisa que a conexão está sendo refeita. */
const RECONNECT_AGE_S = 90;

const horaSP = (d: Date | string | number) => new Date(d).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

type Risk = { nome: string; texto: string; icon: ComponentType<{ className?: string }>; panel: string; tone: string };
const RISKS: Record<CorRisco, Risk> = {
  Vermelho: { nome: "Emergência", texto: "Atendimento imediato", icon: Siren, panel: "border-critical", tone: "text-critical-strong" },
  Laranja: { nome: "Muito urgente", texto: "Atendimento prioritário", icon: AlertTriangle, panel: "border-warning", tone: "text-warning-strong" },
  Amarelo: { nome: "Urgente", texto: "Atendimento com prioridade", icon: Hourglass, panel: "border-caution", tone: "text-caution-strong" },
  Verde: { nome: "Pouco urgente", texto: "Atendimento por ordem de chegada", icon: Leaf, panel: "border-success", tone: "text-success-strong" },
  Azul: { nome: "Não urgente", texto: "Pode aguardar com segurança", icon: Info, panel: "border-cleaning", tone: "text-cleaning-strong" },
  Branco: { nome: "Orientação", texto: "Atendimento simples", icon: Info, panel: "border-border", tone: "text-foreground" },
  "Sem cor": { nome: "Ainda sem classificação", texto: "Aguardando avaliação da equipe", icon: Info, panel: "border-muted-foreground", tone: "text-foreground" },
};
const MAIN_RISKS: CorRisco[] = ["Vermelho", "Laranja", "Amarelo", "Verde", "Azul"];

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function TvPage() {
  const q = usePaPublico();
  const now = useClock();
  const data = q.data;
  const pa = data && !data.aguardando ? data.pa : null;
  const age = useAge(data?.atualizadoEm);
  const fetchAge = q.dataUpdatedAt ? Math.floor((now.getTime() - q.dataUpdatedAt) / 1000) : null;

  const tooOld = (age ?? 0) > MAX_DATA_AGE_S || (q.isError && (fetchAge ?? Infinity) > MAX_DATA_AGE_S);
  const reconnecting = !tooOld && (q.isError || (age ?? 0) > RECONNECT_AGE_S);
  const unavailable = !q.isPending && (!data || tooOld);
  const showNumbers = !!pa?.disponivel && !unavailable;

  const status = q.isPending ? { label: "Conectando…", icon: Wifi, tone: "text-muted-foreground" }
    : unavailable ? { label: "Dados temporariamente indisponíveis", icon: WifiOff, tone: "text-critical-strong" }
    : reconnecting ? { label: `Reconectando… dados de ${data ? horaSP(data.atualizadoEm) : "--:--"}`, icon: WifiOff, tone: "text-warning-strong" }
    : { label: `Online · Atualizado às ${data ? horaSP(data.atualizadoEm) : "--:--"}`, icon: Wifi, tone: "text-success-strong" };

  const t = pa?.totais;
  const delayed = (t?.foraSla ?? 0) > 0;
  const cards = t ? [
    { label: "Aguardando atendimento", value: t.aguardando, icon: Hourglass, border: "border-warning", tone: "text-warning-strong" },
    { label: "Em atendimento agora", value: t.emCurso, icon: Stethoscope, border: "border-cleaning", tone: "text-cleaning-strong" },
    { label: "Atendidas hoje", value: t.finalizados, icon: CheckCircle2, border: "border-success", tone: "text-success-strong" },
  ] : [];
  const risks = pa ? pa.riscos.filter((r) => MAIN_RISKS.includes(r.cor) || r.quantidade === null || r.quantidade > 0) : [];

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <div className="border-b border-border bg-white px-[2.2vw] py-[1.2vh]"><PartnerLogos size="lg" /></div>

      <header className="flex items-center justify-between gap-6 border-b border-border px-[2.2vw] py-[1.4vh]">
        <h1 className="text-[clamp(1.5rem,3.4vh,3rem)] font-bold leading-tight">Pronto atendimento agora</h1>
        <div className="text-right">
          <p className="font-mono text-[clamp(1.5rem,4vh,3.2rem)] font-bold tabular-nums leading-none">{horaSP(now)}</p>
          <p role="status" aria-live="polite" className={cn("mt-1 flex items-center justify-end gap-2 text-[clamp(0.9rem,2vh,1.6rem)] font-semibold", status.tone)}>
            <status.icon className="h-[1.2em] w-[1.2em] shrink-0" />{status.label}
          </p>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col justify-evenly gap-[1.6vh] px-[2.2vw] py-[1.6vh]">
        {unavailable && (
          <div role="status" className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <WifiOff className="h-[10vh] w-[10vh] text-muted-foreground" />
            <p className="text-[clamp(1.8rem,5vh,4rem)] font-extrabold">Dados temporariamente indisponíveis</p>
            <p className="text-[clamp(1.2rem,3vh,2.4rem)]">Para informações, procure a recepção.</p>
          </div>
        )}
        {!q.isPending && !unavailable && !showNumbers && (
          <div role="status" className="flex flex-1 items-center justify-center text-center text-[clamp(1.6rem,4vh,3.2rem)] font-bold">Aguardando as primeiras informações do atendimento</div>
        )}

        {showNumbers && t && (
          <>
            <div className={cn("flex items-center gap-[1.6vw] rounded-xl border-2 border-l-[1.2vh] bg-card px-[2vw] py-[2vh]", delayed ? "border-warning" : "border-success")}>
              {delayed ? <AlertTriangle className="h-[8vh] w-[8vh] shrink-0 text-warning-strong" /> : <CheckCircle2 className="h-[8vh] w-[8vh] shrink-0 text-success-strong" />}
              <div className="min-w-0">
                <p className={cn("text-[clamp(1.6rem,4.6vh,3.8rem)] font-extrabold leading-tight", delayed ? "text-warning-strong" : "text-success-strong")}>
                  {delayed ? "Alguns atendimentos podem levar mais tempo" : "Atendimentos dentro do tempo previsto"}
                </p>
                <p className="mt-1 text-[clamp(1.1rem,2.8vh,2.2rem)] leading-snug">
                  {delayed ? "Se precisar de ajuda, procure a recepção." : "O atendimento é feito pela gravidade do caso, não pela ordem de chegada."}
                </p>
              </div>
              {pa?.espera.maiorMin != null && (
                <div className="ml-auto shrink-0 border-l-2 border-border pl-[1.6vw] text-right">
                  <p className="text-[clamp(0.9rem,2.2vh,1.8rem)] font-bold">Maior tempo de espera</p>
                  <p className="text-[clamp(2rem,6.5vh,5rem)] font-extrabold leading-none tabular-nums">{fmtEspera(pa.espera.maiorMin)}</p>
                </div>
              )}
            </div>

            <section aria-label="Resumo do atendimento" className="grid grid-cols-3 gap-[1.6vw]">
              {cards.map((c) => (
                <article key={c.label} className={cn("rounded-xl border-2 border-t-[1.2vh] bg-card px-[1.6vw] py-[1.6vh]", c.border)}>
                  <p className="flex items-center gap-3 text-[clamp(1.1rem,2.8vh,2.2rem)] font-bold"><c.icon className={cn("h-[1.3em] w-[1.3em] shrink-0", c.tone)} />{c.label}</p>
                  <p className={cn("mt-[1vh] font-extrabold tabular-nums leading-none", c.tone, c.value === null ? "text-[clamp(1.8rem,5vh,4rem)]" : "text-[clamp(3rem,10vh,8rem)]")}>{c.value === null ? "Poucas pessoas" : c.value}</p>
                </article>
              ))}
            </section>

            <section aria-label="Classificação por urgência" className="rounded-xl border-2 border-border bg-card px-[1.6vw] py-[1.6vh]">
              <h2 className="text-[clamp(1.2rem,3vh,2.4rem)] font-bold">Classificação por urgência <span className="font-medium">· quem está mais grave é atendido primeiro</span></h2>
              <div className="mt-[1.2vh] grid gap-[1vw]" style={{ gridTemplateColumns: `repeat(${Math.max(risks.length, 1)}, minmax(0, 1fr))` }}>
                {risks.map((r) => {
                  const info = RISKS[r.cor];
                  return (
                    <div key={r.cor} className={cn("min-w-0 rounded-lg border-2 border-t-[1vh] bg-background px-[0.9vw] py-[1vh]", info.panel)}>
                      <p className={cn("flex items-center gap-2 text-[clamp(1rem,2.4vh,2rem)] font-bold", info.tone)}><info.icon className="h-[1.2em] w-[1.2em] shrink-0" />{info.nome}</p>
                      <p className="text-[clamp(0.85rem,1.9vh,1.5rem)]">{info.texto}</p>
                      <p className={cn("mt-[0.8vh] font-extrabold tabular-nums leading-none", r.quantidade === null ? "text-[clamp(1.1rem,2.8vh,2.2rem)]" : "text-[clamp(2rem,6vh,5rem)]")}>{r.quantidade === null ? "Poucas pessoas" : r.quantidade}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="border-t border-border bg-card px-[2.2vw] py-[1.2vh]">
        <p className="flex items-center gap-3 text-[clamp(1rem,2.4vh,2rem)] font-semibold"><Info className="h-[1.2em] w-[1.2em] shrink-0 text-primary" />Se o seu estado piorar enquanto aguarda, avise imediatamente a equipe de classificação.</p>
        <p className="mt-1 flex flex-wrap items-center justify-between gap-x-6 text-[clamp(0.8rem,1.7vh,1.3rem)]">
          <span className="flex items-center gap-2"><ShieldCheck className="h-[1.2em] w-[1.2em] shrink-0 text-success-strong" />Nenhum nome ou dado pessoal é mostrado.{(pa?.riscos.some((r) => r.quantidade === null) || cards.some((c) => c.value === null)) && " Quando há de 1 a 4 pessoas, o número fica oculto."}</span>
          <span>{CREDIT_TI}</span>
        </p>
      </footer>
    </div>
  );
}
