import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Check, ChevronRight, Clock3, DoorOpen, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { Room, RoomStatus } from "@/lib/mock-data";

const statusClass: Record<RoomStatus, string> = { "Em cirurgia": "status-surgery", "Em preparo": "status-prep", "Em limpeza": "status-cleaning", Livre: "status-free", "Em atraso": "status-delay" };
export function StatusBadge({ status }: { status: RoomStatus | string }) {
  const cls = status in statusClass ? statusClass[status as RoomStatus] : "status-free";
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", cls)}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span>;
}

export function MetricCard({ label, value, icon: Icon, tone = "default" }: { label: string; value: string | number; icon?: LucideIcon; tone?: "default" | "good" | "warn" }) {
  return <div className={cn("metric-card", tone === "good" && "border-l-success", tone === "warn" && "border-l-warning")}>
    <div><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p></div>
    {Icon && <span className="grid h-9 w-9 place-items-center rounded-md bg-muted text-muted-foreground"><Icon className="h-4 w-4" /></span>}
  </div>;
}

export function Filters({ options, active, onChange }: { options: string[]; active: string; onChange: (value: string) => void }) {
  return <div className="flex flex-wrap gap-1 rounded-md border border-border bg-card p-1" role="group" aria-label="Filtros">
    {options.map((option) => <button key={option} onClick={() => onChange(option)} className={cn("rounded px-3 py-1.5 text-sm font-medium transition-colors", active === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>{option}</button>)}
  </div>;
}

export function RoomCard({ room }: { room: Room }) {
  return <Link to="/salas/$roomId" params={{ roomId: room.id }} className="room-card group">
    <div className="flex items-start justify-between gap-3 border-b border-border p-4">
      <div><p className="text-xs font-bold uppercase text-muted-foreground">{room.name}</p><h3 className="mt-1 text-base font-bold text-foreground">{room.procedure}</h3></div><StatusBadge status={room.status} />
    </div>
    <div className="grid gap-4 p-4">
      <div className="grid grid-cols-2 gap-3 text-sm"><Info label="Paciente" value={room.patient} /><Info label="Prontuário" value={room.record} /><Info label="Prioridade" value={room.priority} /><Info label="Previsto / início" value={`${room.scheduled} / ${room.started}`} /></div>
      <div className="flex items-end justify-between rounded-md bg-muted p-3"><div><p className="text-xs text-muted-foreground">Tempo em sala</p><p className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">{room.elapsed}</p></div><Clock3 className="h-5 w-5 text-muted-foreground" /></div>
      <div><p className="mb-2 text-xs font-semibold text-muted-foreground">Marcos registrados</p><div className="flex flex-wrap gap-1.5">{room.milestones.map((m) => <span key={m} className="inline-flex items-center gap-1 rounded bg-surface-positive px-2 py-1 text-xs text-success-strong"><Check className="h-3 w-3" />{m}</span>)}</div></div>
      <div className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold", room.note.includes("pendente") || room.status === "Em atraso" || room.id === "02" ? "bg-surface-warning text-warning-strong" : "bg-muted text-muted-foreground")}><AlertTriangle className="h-4 w-4 shrink-0" />{room.note}</div>
      <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{room.team}</span><ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></div>
    </div>
  </Link>;
}

function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 font-semibold text-foreground">{value}</p></div>; }

export function TimelineItem({ time, title, state, detail }: { time: string; title: string; state: "done" | "pending" | "attention"; detail: string }) {
  return <div className="relative grid grid-cols-[52px_24px_1fr] gap-3 pb-5 last:pb-0"><span className="pt-0.5 font-mono text-xs font-bold text-muted-foreground">{time}</span><span className={cn("relative z-10 grid h-6 w-6 place-items-center rounded-full border-2 bg-card", state === "done" ? "border-success text-success" : state === "attention" ? "border-warning text-warning-strong" : "border-border text-muted-foreground")}>{state === "done" ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}</span><div><p className="text-sm font-semibold text-foreground">{title}</p><p className="mt-0.5 text-xs text-muted-foreground">{detail}</p></div></div>;
}

export function AlertCard({ priority, origin, description, time, action, viewed, onView }: { priority: string; origin: string; description: string; time: string; action: string; viewed?: boolean; onView?: () => void }) {
  return <div className={cn("grid gap-3 border-l-4 bg-card p-4 shadow-card md:grid-cols-[100px_110px_1fr_80px_auto] md:items-center", priority === "Crítico" ? "border-l-critical" : priority === "Alto" ? "border-l-warning" : "border-l-caution", viewed && "opacity-55")}>
    <span className={cn("text-xs font-extrabold uppercase", priority === "Crítico" ? "text-critical" : priority === "Alto" ? "text-warning-strong" : "text-caution-strong")}>{priority}</span><span className="font-bold text-foreground">{origin}</span><div><p className="text-sm text-foreground">{description}</p><p className="mt-1 text-xs text-muted-foreground">Ação: {action}</p></div><span className="font-mono text-sm text-muted-foreground">{time}</span>{onView && <button onClick={onView} disabled={viewed} className="text-left text-xs font-bold text-primary hover:underline disabled:no-underline">{viewed ? "Visualizado" : "Marcar como visualizado"}</button>}
  </div>;
}