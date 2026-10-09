import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoomStatus } from "@/lib/mock-data";

const statusClass: Record<RoomStatus, string> = { "Em cirurgia": "status-surgery", "Em preparo": "status-prep", "Em limpeza": "status-cleaning", Livre: "status-free", "Em atraso": "status-delay" };
export function StatusBadge({ status }: { status: RoomStatus | string }) {
  const cls = status in statusClass ? statusClass[status as RoomStatus] : "status-free";
  const paClass = status === "Finalizado" ? "bg-surface-positive text-success-strong" : status.includes("Aguardando") ? "bg-surface-warning text-warning-strong" : status.includes("curso") || status.includes("Chamado") ? "bg-cleaning/15 text-primary" : cls;
  return <span className={cn("inline-flex max-w-full items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold", paClass)}><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" /><span className="whitespace-normal">{status}</span></span>;
}

export function MetricCard({ label, value, icon: Icon, tone = "default" }: { label: string; value: string | number; icon?: LucideIcon; tone?: "default" | "good" | "warn" }) {
  return <div className={cn("metric-card min-w-0 gap-2", tone === "good" && "border-l-success", tone === "warn" && "border-l-warning")}>
    <div className="min-w-0"><p className="text-xs font-semibold leading-5 text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-bold tabular-nums text-foreground">{value}</p></div>
    {Icon && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"><Icon className="h-4 w-4" /></span>}
  </div>;
}

export function Filters({ options, active, onChange }: { options: string[]; active: string; onChange: (value: string) => void }) {
  return <div className="flex flex-wrap gap-1 rounded-md border border-border bg-card p-1" role="group" aria-label="Filtros">
    {options.map((option) => <button key={option} onClick={() => onChange(option)} className={cn("rounded px-3 py-1.5 text-sm font-medium transition-colors", active === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>{option}</button>)}
  </div>;
}



export function TimelineItem({ time, title, state, detail }: { time: string; title: string; state: "done" | "pending" | "attention"; detail: string }) {
  return <div className="relative grid grid-cols-[52px_24px_1fr] gap-3 pb-5 last:pb-0"><span className="pt-0.5 font-mono text-xs font-bold text-muted-foreground">{time}</span><span className={cn("relative z-10 grid h-6 w-6 place-items-center rounded-full border-2 bg-card", state === "done" ? "border-success text-success" : state === "attention" ? "border-warning text-warning-strong" : "border-border text-muted-foreground")}>{state === "done" ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}</span><div><p className="text-sm font-semibold text-foreground">{title}</p><p className="mt-0.5 text-xs text-muted-foreground">{detail}</p></div></div>;
}

export function AlertCard({ priority, origin, description, time, action, viewed, onView }: { priority: string; origin: string; description: string; time: string; action: string; viewed?: boolean; onView?: () => void }) {
  return <div className={cn("grid gap-3 border-l-4 bg-card p-4 shadow-card md:grid-cols-[100px_110px_1fr_80px_auto] md:items-center", priority === "Crítico" ? "border-l-critical" : priority === "Alto" ? "border-l-warning" : "border-l-caution", viewed && "opacity-55")}>
    <span className={cn("text-xs font-extrabold uppercase", priority === "Crítico" ? "text-critical" : priority === "Alto" ? "text-warning-strong" : "text-caution-strong")}>{priority}</span><span className="font-bold text-foreground">{origin}</span><div><p className="text-sm text-foreground">{description}</p><p className="mt-1 text-xs text-muted-foreground">Ação: {action}</p></div><span className="font-mono text-sm text-muted-foreground">{time}</span>{onView && <button onClick={onView} disabled={viewed} className="text-left text-xs font-bold text-primary hover:underline disabled:no-underline">{viewed ? "Visualizado" : "Marcar como visualizado"}</button>}
  </div>;
}