import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { getPa, getPaPublico, getPainel, getSala } from "./maternidade-api";
import { cn } from "./utils";

export const REFRESH_MS = 15000;

export function usePainel() {
  return useQuery({ queryKey: ["painel"], queryFn: () => getPainel(), refetchInterval: REFRESH_MS, refetchIntervalInBackground: true });
}

export function usePa() {
  return useQuery({ queryKey: ["pa"], queryFn: () => getPa(), refetchInterval: REFRESH_MS, refetchIntervalInBackground: true });
}

export function useSala(id: string) {
  return useQuery({ queryKey: ["sala", id], queryFn: () => getSala({ data: { id } }), refetchInterval: REFRESH_MS, refetchIntervalInBackground: true });
}

export function formatGerado(iso: string, withTime = true) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const cap = date.charAt(0).toUpperCase() + date.slice(1);
  if (!withTime) return cap;
  return `${cap} · ${d.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })}`;
}

export function fmtMin(min: number | null | undefined) {
  if (min == null || Number.isNaN(min)) return "—";
  const m = Math.round(min);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}h${String(m % 60).padStart(2, "0")}`;
}

export function DataError({ dark }: { dark?: boolean }) {
  return <div role="alert" className={cn("flex items-center gap-2 rounded-md border p-4 text-sm font-semibold", dark ? "border-amber-500/40 bg-amber-500/10 text-amber-300" : "border-warning bg-surface-warning text-warning-strong")}>
    <AlertTriangle className="h-4 w-4 shrink-0" />Fonte de dados indisponível, tentando novamente
  </div>;
}

export function PageSkeleton({ dark }: { dark?: boolean }) {
  const b = dark ? "bg-slate-800" : "bg-muted";
  return <div aria-busy="true" aria-label="Carregando" className="animate-pulse space-y-4">
    <div className={cn("h-8 w-72 rounded", b)} />
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{Array.from({ length: 6 }, (_, i) => <div key={i} className={cn("h-24 rounded-md", b)} />)}</div>
    <div className="grid gap-4 xl:grid-cols-2">{Array.from({ length: 4 }, (_, i) => <div key={i} className={cn("h-48 rounded-md", b)} />)}</div>
  </div>;
}

export const STALE_SECONDS = 90;

/** Segundos desde atualizado_em (relógio do banco), atualizando a cada segundo. */
export function useAge(atualizadoEm?: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  if (!atualizadoEm || now == null) return null;
  return Math.max(0, Math.floor((now - new Date(atualizadoEm).getTime()) / 1000));
}

export function StaleNotice({ age, dark }: { age: number | null; dark?: boolean }) {
  if (age == null || age <= STALE_SECONDS) return null;
  return <span role="status" className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", dark ? "bg-amber-500/15 text-amber-300" : "bg-surface-warning text-warning-strong")}><AlertTriangle className="h-3.5 w-3.5" />Dados desatualizados há {Math.floor(age / 60)} min</span>;
}

export function usePaPublico() {
  return useQuery({ queryKey: ["pa-public-summary"], queryFn: () => getPaPublico(), refetchInterval: REFRESH_MS, refetchIntervalInBackground: true });
}
