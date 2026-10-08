import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, AlertTriangle, BookOpen, ClipboardPlus, Droplets, Headset, HeartPulse, Pause, Play, Radio, ShieldAlert, Syringe, Thermometer, UserRoundCog, Wind } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { StatusBadge, TimelineItem } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import type { RoomDetail as RoomDetailData } from "@/lib/mock-data";
import { DataError, PageSkeleton, useSala } from "@/lib/use-painel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/salas/$roomId")({
  head: () => ({ meta: [
    { title: "Monitor da Sala em Tempo Real — Centro Cirúrgico Materno" },
    { name: "description", content: "Sinais vitais, tempos, medicações e eventos da paciente em cirurgia, atualizados em tempo real." },
    { property: "og:title", content: "Monitor da Sala em Tempo Real — Centro Cirúrgico Materno" },
    { property: "og:description", content: "Sinais vitais, tempos, medicações e eventos da paciente em cirurgia, atualizados em tempo real." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: RoomDetail,
  errorComponent: ({ error }) => <div role="alert" className="p-6">{error instanceof Error ? error.message : "Erro inesperado"}</div>,
  notFoundComponent: () => <div className="p-6">Sala não encontrada.</div>,
});

type Vital = { key: string; label: string; unit: string; icon: typeof HeartPulse; min: number; max: number; lo: number; hi: number; step: number; start: number; decimals?: number };
const VITALS: Vital[] = [
  { key: "fc", label: "Frequência cardíaca", unit: "bpm", icon: HeartPulse, min: 50, max: 150, lo: 60, hi: 110, step: 3, start: 92 },
  { key: "pas", label: "PA sistólica", unit: "mmHg", icon: Activity, min: 70, max: 170, lo: 90, hi: 140, step: 3, start: 118 },
  { key: "pad", label: "PA diastólica", unit: "mmHg", icon: Activity, min: 40, max: 110, lo: 50, hi: 90, step: 2, start: 72 },
  { key: "spo2", label: "SpO₂", unit: "%", icon: Droplets, min: 88, max: 100, lo: 94, hi: 101, step: 1, start: 98 },
  { key: "fr", label: "Freq. respiratória", unit: "irpm", icon: Wind, min: 8, max: 30, lo: 12, hi: 22, step: 1, start: 16 },
  { key: "temp", label: "Temperatura", unit: "°C", icon: Thermometer, min: 35, max: 38.5, lo: 35.8, hi: 37.8, step: 0.1, start: 36.4, decimals: 1 },
];

const MEDS = [
  ["09:52", "Bupivacaína pesada 0,5%", "12,5 mg · raqui"], ["09:52", "Morfina", "80 mcg · raqui"], ["09:58", "Cefazolina", "2 g · EV"], ["10:05", "Fenilefrina", "100 mcg · EV"], ["10:19", "Ocitocina", "5 UI · EV lento"],
];
const EVENT_POOL = ["PA não invasiva aferida", "Balanço hídrico atualizado", "Contagem de compressas conferida", "Sinais vitais registrados pela anestesia", "Banco de sangue: prova cruzada em andamento", "Ocitocina em infusão contínua", "Aspiração: volume atualizado"];

const fmt = (s: number) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");
const clock = () => new Date().toLocaleTimeString("pt-BR");

function RoomDetail() {
  const { roomId } = Route.useParams();
  const { data, isPending, isError } = useSala(roomId);
  if (isPending) return <PageSkeleton />;
  if (!data) return <div><PageHeader title="Monitor da sala" subtitle="—" back="/" /><DataError /></div>;
  if ("naoEncontrada" in data) return <div className="p-6">Sala não encontrada.</div>;
  return <>{isError && <div className="mb-4"><DataError /></div>}<RoomLive key={data.sala.id} room={data.sala} /></>;
}

function RoomLive({ room }: { room: RoomDetailData }) {
  const live = room.status === "Em cirurgia";
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState("");
  const [series, setSeries] = useState<Record<string, number[]>>(() => Object.fromEntries(VITALS.map((v) => [v.key, Array.from({ length: 30 }, () => v.start)])));
  const [fluids, setFluids] = useState({ in: 1350, blood: 620, urine: 180 });
  const [events, setEvents] = useState<{ t: string; m: string }[]>([{ t: "10:46", m: "Solicitação de hemocomponentes enviada" }, { t: "10:44", m: "Sinais vitais registrados pela anestesia" }]);
  const r = useRef(running); r.current = running;

  useEffect(() => {
    setNow(clock());
    const id = setInterval(() => {
      setNow(clock());
      if (!r.current || !live) return;
      setTick((t) => t + 1);
      setSeries((prev) => Object.fromEntries(VITALS.map((v) => {
        const arr = prev[v.key] ?? [v.start]; const last = arr[arr.length - 1] ?? v.start;
        const drift = (v.start - last) * 0.15 + (Math.random() - 0.5) * 2 * v.step;
        const next = Math.min(v.max, Math.max(v.min, +(last + drift).toFixed(v.decimals ?? 0)));
        return [v.key, [...arr.slice(1), next]];
      })));
      if (Math.random() < 0.3) setFluids((f) => ({ in: f.in + 10, blood: f.blood + Math.round(Math.random() * 8), urine: f.urine + Math.round(Math.random() * 4) }));
      if (Math.random() < 0.08) setEvents((e) => [{ t: clock().slice(0, 5), m: EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)] ?? "" }, ...e].slice(0, 8));
    }, 1000);
    return () => clearInterval(id);
  }, [live]);

  const demo = (label: string) => { toast.success(`${label}: ação simulada com sucesso.`); setEvents((e) => [{ t: clock().slice(0, 5), m: label }, ...e].slice(0, 8)); };
  const base = { anest: 3492, cir: 2858 };
  const balance = fluids.in - fluids.blood - fluids.urine;

  return <div>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <PageHeader title={`${room.name} — ${room.procedure}`} subtitle={`Paciente ${room.patient} · ${room.record} · ${room.priority}`} back="/" />
      <div className="flex items-center gap-2">
        {live && <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", running ? "bg-surface-positive text-success-strong" : "bg-muted text-muted-foreground")}><Radio className={cn("h-3.5 w-3.5", running && "animate-pulse")} />{running ? "AO VIVO" : "PAUSADO"}</span>}
        <span className="font-mono text-sm tabular-nums text-muted-foreground">{now}</span>
        <StatusBadge status={room.status} />
        {live && <Button onClick={() => setRunning((v) => !v)}>{running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{running ? "Pausar" : "Retomar"}</Button>}
      </div>
    </div>

    {!live && <section className="mb-5 rounded-md border border-warning bg-surface-warning p-4 text-sm text-warning-strong"><AlertTriangle className="mr-2 inline h-4 w-4" />Esta sala não está em cirurgia no momento ({room.status}). Monitoramento em tempo real indisponível — {room.note}.</section>}

    <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[["Tempo em sala", live ? fmt(room.emSalaMin * 60 + tick) : room.elapsed], ["Tempo de anestesia", live ? fmt(base.anest + tick) : "—"], ["Tempo cirúrgico", live ? fmt(base.cir + tick) : "—"], ["Meta de término", room.id === "02" ? "11:08" : "—"]].map(([label, value]) => <div key={label} className="rounded-md border border-border bg-card p-4 shadow-card"><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-2 font-mono text-2xl font-bold tabular-nums">{value}</p></div>)}
    </section>

    {live && <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {VITALS.map((v) => { const arr = series[v.key] ?? [v.start]; const val = arr[arr.length - 1] ?? v.start; const alert = val < v.lo || val > v.hi; return <div key={v.key} className={cn("rounded-md border bg-card p-4 shadow-card", alert ? "border-critical" : "border-border")}>
        <div className="flex items-center justify-between"><p className="text-xs font-semibold text-muted-foreground">{v.label}</p><v.icon className={cn("h-4 w-4", alert ? "text-critical" : "text-primary")} /></div>
        <p className={cn("mt-2 font-mono text-3xl font-bold tabular-nums", alert && "text-critical")}>{v.decimals ? val.toFixed(v.decimals) : val}<span className="ml-1 text-xs font-medium text-muted-foreground">{v.unit}</span></p>
        <Spark data={arr} min={v.min} max={v.max} alert={alert} />
        <p className="mt-1 text-[10px] text-muted-foreground">Referência {v.lo}–{v.hi === 101 ? 100 : v.hi}</p>
      </div>; })}
    </section>}

    <div className="grid gap-5 xl:grid-cols-[1fr_1.4fr]">
      <div className="space-y-5">
        <section className="rounded-md border border-border bg-card p-5 shadow-card"><h2 className="mb-5 font-bold">Linha do tempo</h2><div className="timeline-line">{room.linhaDoTempo.map((t) => <TimelineItem key={t.titulo} time={t.horario} title={t.titulo} state={t.estado} detail={t.estado === "done" ? "Concluído" : t.estado === "attention" ? "Requer atenção" : "Pendente"} />)}</div></section>
        <section className="rounded-md border border-border bg-card p-5 shadow-card"><div className="flex items-center justify-between"><h2 className="font-bold">Eventos em tempo real</h2>{live && running && <span className="h-2 w-2 animate-pulse rounded-full bg-success" />}</div><ul className="mt-3 divide-y divide-border text-sm">{events.map((e, i) => <li key={i + e.t + e.m} className="flex gap-3 py-2"><span className="font-mono text-xs text-muted-foreground">{e.t}</span><span>{e.m}</span></li>)}</ul></section>
      </div>
      <div className="space-y-5">
        {live && <section className="rounded-md border border-border bg-card p-5 shadow-card"><h2 className="font-bold">Balanço hídrico</h2><div className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">{[["Infundido", fluids.in], ["Sangramento", fluids.blood], ["Diurese", fluids.urine], ["Balanço", balance]].map(([l, v]) => <div key={l}><p className="text-xs text-muted-foreground">{l}</p><p className={cn("mt-1 font-mono text-xl font-bold tabular-nums", l === "Sangramento" && Number(v) > 800 && "text-critical")}>{Number(v) > 0 && l === "Balanço" ? "+" : ""}{v} mL</p></div>)}</div></section>}
        <section className="rounded-md border border-border bg-card p-5 shadow-card"><div className="flex items-center gap-2"><Syringe className="h-5 w-5 text-primary" /><h2 className="font-bold">Medicações administradas</h2></div><ul className="mt-3 divide-y divide-border text-sm">{(live ? MEDS : []).map(([t, n, d]) => <li key={n} className="grid grid-cols-[52px_1fr_auto] gap-3 py-2"><span className="font-mono text-xs text-muted-foreground">{t}</span><span className="font-semibold">{n}</span><span className="text-xs text-muted-foreground">{d}</span></li>)}{!live && <li className="py-2 text-muted-foreground">Nenhuma medicação registrada.</li>}</ul></section>
        <section className="rounded-md border border-border bg-card p-5 shadow-card"><h2 className="font-bold">Equipe atual</h2><div className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-3">{room.equipe.map(({ papel: role, nome: name }) => <div key={role}><p className="text-xs text-muted-foreground">{role}</p><p className="mt-1 font-semibold">{name}</p></div>)}</div></section>
        <section className="rounded-md border border-border bg-card p-5 shadow-card"><div className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-primary" /><h2 className="font-bold">Resumo clínico autorizado</h2></div><div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 text-sm md:grid-cols-3">{["Alergias", "Grupo sanguíneo", "Jejum", "Consentimento", "Exames relevantes", "Precauções"].map((label) => [label, "Não disponível"] as const).map(([label, value]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}</div></section>
        <section className="rounded-md border border-warning bg-surface-warning p-4"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-strong" /><div><h2 className="font-bold text-warning-strong">Alertas e pendências</h2><ul className="mt-2 space-y-2 text-sm text-warning-strong"><li>{room.note}.</li>{room.pendencias.map((p) => <li key={p}>{p}</li>)}</ul></div></div></section>
      </div>
    </div>

    <section className="mt-5 flex flex-wrap gap-2 rounded-md border border-border bg-card p-4 shadow-card">
      <Button variant="primary" onClick={() => demo("Marco registrado")}><ClipboardPlus className="h-4 w-4" />Registrar marco</Button>
      <Button onClick={() => demo("Equipe atualizada")}><UserRoundCog className="h-4 w-4" />Atualizar equipe</Button>
      <Button onClick={() => demo("Intercorrência registrada")}><AlertTriangle className="h-4 w-4" />Registrar intercorrência</Button>
      <Button onClick={() => demo("Apoio solicitado")}><Headset className="h-4 w-4" />Solicitar apoio</Button>
      <Button onClick={() => demo("Prontuário aberto")}><BookOpen className="h-4 w-4" />Abrir prontuário</Button>
    </section>
  </div>;
}

function Spark({ data, min, max, alert }: { data: number[]; min: number; max: number; alert: boolean }) {
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${30 - ((v - min) / (max - min)) * 30}`).join(" ");
  return <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn("mt-2 h-8 w-full", alert ? "text-critical" : "text-primary")}><polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>;
}
