import { User } from "lucide-react";
import { cn } from "@/lib/utils";

/** Pictograma: um boneco por pessoa (até `max`), para leitura rápida sem depender só do número. */
export function PeopleRow({ count, max = 10, className }: { count: number; max?: number; className?: string }) {
  const shown = Math.min(count, max);
  return (
    <div aria-hidden className={cn("flex min-h-6 flex-wrap items-center gap-0.5", className)}>
      {shown === 0
        ? <User className="h-6 w-6 shrink-0 opacity-25" strokeWidth={1.5} />
        : Array.from({ length: shown }, (_, i) => <User key={i} className="h-6 w-6 shrink-0" fill="currentColor" strokeWidth={1.5} />)}
      {count > max && <span className="ml-1 text-sm font-bold">+{count - max}</span>}
    </div>
  );
}

/** Barra proporcional empilhada (ex.: distribuição por urgência). */
export function StackBar({ parts, label }: { parts: { name: string; value: number; className: string }[]; label: string }) {
  const total = parts.reduce((sum, p) => sum + p.value, 0);
  return (
    <div role="img" aria-label={label} className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
      {total > 0 && parts.filter((p) => p.value > 0).map((p) => <div key={p.name} title={`${p.name}: ${p.value}`} className={p.className} style={{ width: `${(p.value / total) * 100}%` }} />)}
    </div>
  );
}
