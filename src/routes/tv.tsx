import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, AlertTriangle, Bell, ChevronLeft, Clock3, Droplets, HeartPulse, Maximize, Radio, Wind } from "lucide-react";
import { alerts, rooms, type Room } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tv")({
  head: () => ({ meta: [
    { title: "Painel de TV — Centro Cirúrgico Materno" },
    { name: "description", content: "Painel de projeção em tela grande para a equipe acompanhar salas, sinais vitais e alertas em tempo real." },
    { property: "og:title", content: "Painel de TV — Centro Cirúrgico Materno" },
    { property: "og:description", content: "Painel de projeção em tela grande para a equipe acompanhar salas, sinais vitais e alertas em tempo real." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: TvBoard,
});

type VitalDef = { key: string; label: string; unit: string; icon: typeof HeartPulse; min: number; max: number; lo: number; hi: number; step: number; start: number; decimals?: number };
const VITALS: VitalDef[] = [
  { key: "fc", label: "FC", unit: "bpm", icon: HeartPulse, min: 50, max: 150, lo: 60, hi: 110, step: 3, start: 92 },
  { key: "pas", label: "PAS", unit: "mmHg", icon: Activity, min: 70, max: 170, lo: 90, hi: 140, step: 3, start: 118 },
  { key: "spo2", label: "SpO₂", unit: "%", icon: Droplets, min: 88, max: 100, lo: 94, hi: 101, step: 1, start: 98 },
  { key: "fr", label: "FR", unit: "irpm", icon: Wind, min: 8, max: 30, lo: 12, hi: 22, step: 1, start: 16 },
];

const STATUS_STYLE: Record<Room["status"], string> = {
  "Em cirurgia": "bg-emerald-500/15 text-emerald-300 ring-emerald-400/40",
  "Em preparo": "bg-sky-500/15 text-sky-300 ring-sky-400/40",
  "Em limpeza": "bg-slate-500/15 text-slate-300 ring-slate-400/40",
  "Livre": "bg-slate-500/10 text-slate-400 ring-slate-500/30",
  "Em atraso": "bg-amber-500/15 text-amber-300 ring-amber-400/40",
};

const clock = () => new Date().toLocaleTimeString("pt-BR");
const fmt = (s: number) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");

function TvBoard() {
  const [now, setNow] = useState("");
  const [tick, setTick] = useState(0);
  const liveRooms = rooms.filter((r) => r.status === "Em cirurgia");
  const [series, setSeries] = useState<Record<string, Record<string, number[]>>>(() =>
    Object.fromEntries(liveRooms.map((r) => [r.id, Object.fromEntries(VITALS.map((v) => [v.key, Array.from({ length: 24 }, () => v.start)]))])));

  useEffect(() => {
    setNow(clock());
    const id = setInterval(() => {
      setNow(clock());
      setTick((t) => t + 1);
      setSeries((prev) => Object.fromEntries(liveRooms.map((r) => [r.id, Object.fromEntries(VITALS.map((v) => {
        const arr = prev[r.id]?.[v.key] ?? [v.start];
        const last = arr[arr.length - 1] ?? v.start;
        const drift = (v.start - last) * 0.15 + (Math.random() - 0.5) * 2 * v.step;
        const next = Math.min(v.max, Math.max(v.min, +(last + drift).toFixed(v.decimals ?? 0)));
        return [v.key, [...arr.slice(1), next]];
      }))])));
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fullscreen = () => { if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.(); else void document.exitFullscreen?.(); };

  return <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
    <header className="flex items-center justify-between gap-4 border-b border-slate-800 px-6 py-4">
      <div className="flex min-w-0 items-center gap-4">
        <Link to="/" className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-slate-700 text-slate-400 hover:text-slate-100" aria-label="Voltar ao painel"><ChevronLeft className="h-5 w-5" /></Link>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-sky-500 text-slate-950"><Activity className="h-6 w-6" /></span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-black tracking-tight md:text-3xl">Centro Cirúrgico Materno</h1>
          <p className="text-sm text-slate-400">Acompanhamento operacional em tempo real</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-1.5 text-sm font-bold text-emerald-300 ring-1 ring-emerald-400/40"><Radio className="h-4 w-4 animate-pulse" />AO VIVO</span>
        <span className="hidden items-center gap-2 font-mono text-3xl font-bold tabular-nums md:flex"><Clock3 className="h-6 w-6 text-slate-400" />{now}</span>
        <button onClick={fullscreen} className="grid h-10 w-10 place-items-center rounded-md border border-slate-700 text-slate-400 hover:text-slate-100" aria-label="Tela cheia"><Maximize className="h-5 w-5" /></button>
      </div>
    </header>

    <main className="grid flex-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
      {rooms.map((room, i) => <RoomTile key={room.id} room={room} tick={tick} vitals={series[room.id]} index={i} />)}
    </main>

    <footer className="border-t border-slate-800 px-6 py-3">
      <div className="flex items-center gap-3 overflow-hidden">
        <span className="inline-flex shrink-0 items-center gap-2 rounded-md bg-red-500/15 px-3 py-1 text-sm font-bold text-red-300 ring-1 ring-red-400/40"><Bell className="h-4 w-4" />Alertas</span>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex w-max animate-[ticker_30s_linear_infinite] gap-10 whitespace-nowrap text-sm text-slate-300">
            {[...alerts, ...alerts].map((a, i) => <span key={i} className="inline-flex items-center gap-2"><AlertTriangle className={cn("h-4 w-4", a.priority === "Crítico" ? "text-red-400" : "text-amber-400")} /><strong>{a.origin}:</strong> {a.description} <span className="text-slate-500">· {a.time}</span></span>)}
          </div>
        </div>
        <span className="hidden shrink-0 text-xs text-slate-500 lg:block">Ambiente demonstrativo — dados fictícios e mascarados</span>
      </div>
    </footer>
    <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
  </div>;
}

function RoomTile({ room, tick, vitals, index }: { room: Room; tick: number; vitals?: Record<string, number[]> | undefined; index: number }) {
  const live = room.status === "Em cirurgia";
  const baseSala = 4935 + index * 300;
  return <section className={cn("flex flex-col rounded-xl border p-5 shadow-lg", live ? "border-emerald-500/40 bg-slate-900" : room.status === "Em atraso" ? "border-amber-500/40 bg-slate-900" : "border-slate-800 bg-slate-900/60")}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-2xl font-black">{room.name}</h2>
        <p className="mt-0.5 truncate text-sm text-slate-400">{room.procedure} · {room.patient} · {room.record}</p>
      </div>
      <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-bold ring-1", STATUS_STYLE[room.status])}>{room.status}</span>
    </div>

    <div className="mt-4 flex items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tempo em sala</p>
        <p className="font-mono text-4xl font-black tabular-nums">{live ? fmt(baseSala + tick) : room.elapsed}</p>
      </div>
      <div className="text-right text-xs text-slate-400">
        <p>Prevista {room.scheduled}</p>
        <p>Início {room.started}</p>
        <p className="mt-1 font-semibold text-slate-300">{room.priority}</p>
      </div>
    </div>

    {live && vitals ? <div className="mt-4 grid grid-cols-2 gap-2">
      {VITALS.map((v) => { const arr = vitals[v.key] ?? [v.start]; const val = arr[arr.length - 1] ?? v.start; const alert = val < v.lo || val > v.hi; return <div key={v.key} className={cn("rounded-lg border p-3", alert ? "border-red-500/60 bg-red-500/10" : "border-slate-800 bg-slate-950/60")}>
        <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-400">{v.label}</span><v.icon className={cn("h-4 w-4", alert ? "text-red-400" : "text-sky-400")} /></div>
        <p className={cn("mt-1 font-mono text-3xl font-black tabular-nums", alert && "text-red-300")}>{v.decimals ? val.toFixed(v.decimals) : val}<span className="ml-1 text-xs font-medium text-slate-500">{v.unit}</span></p>
        <Spark data={arr} min={v.min} max={v.max} alert={alert} />
      </div>; })}
    </div> : <div className="mt-4 flex flex-1 items-center rounded-lg border border-dashed border-slate-800 p-4 text-sm text-slate-400"><AlertTriangle className="mr-2 h-4 w-4 shrink-0 text-slate-500" />{room.note}.</div>}

    <p className="mt-4 truncate text-xs text-slate-500">Equipe: {room.team}</p>
  </section>;
}

function Spark({ data, min, max, alert }: { data: number[]; min: number; max: number; alert: boolean }) {
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${26 - ((v - min) / (max - min)) * 26}`).join(" ");
  return <svg viewBox="0 0 100 26" preserveAspectRatio="none" className={cn("mt-1 h-6 w-full", alert ? "text-red-400" : "text-sky-400")}><polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>;
}
