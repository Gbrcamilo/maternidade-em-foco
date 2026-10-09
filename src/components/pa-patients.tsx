import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard-ui";
import type { CorRisco, PaPaciente } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const CORES: CorRisco[] = ["Vermelho", "Laranja", "Amarelo", "Verde", "Azul", "Branco", "Sem cor"];
export const corChip: Record<CorRisco, string> = {
  Vermelho: "bg-critical text-critical-foreground", Laranja: "bg-warning text-foreground",
  Amarelo: "bg-caution text-foreground", Verde: "bg-success text-critical-foreground",
  Azul: "bg-cleaning text-foreground", Branco: "bg-card text-foreground border border-border",
  "Sem cor": "bg-muted text-muted-foreground",
};
export const corBar: Record<CorRisco, string> = {
  Vermelho: "bg-critical", Laranja: "bg-warning", Amarelo: "bg-caution", Verde: "bg-success",
  Azul: "bg-cleaning", Branco: "bg-card border border-border", "Sem cor": "bg-muted-foreground/40",
};
const corRow: Record<CorRisco, string> = {
  Vermelho: "bg-critical/10", Laranja: "bg-warning/15", Amarelo: "bg-caution/20",
  Verde: "bg-success/10", Azul: "bg-cleaning/15", Branco: "bg-muted", "Sem cor": "bg-muted",
};
export type ColKey = "senha" | "paciente" | "especialidade" | "cor" | "situacao" | "chegada" | "esperaClassifMin" | "esperaAtendMin" | "tempoTotalMin" | "sla";
export type PatientSort = { key: ColKey; dir: 1 | -1 } | null;
export const cols: [ColKey | null, string][] = [
  ["senha", "Senha"], ["paciente", "Paciente"], [null, "Atendimento"], ["especialidade", "Especialidade"],
  ["cor", "Risco"], ["situacao", "Situação"], ["chegada", "Chegada"],
  ["esperaClassifMin", "Espera p/ classificação"], ["esperaAtendMin", "Espera p/ médico"], ["tempoTotalMin", "Tempo total"], ["sla", "SLA"],
];
export function slaText(p: PaPaciente) {
  if (p.slaMin == null) return "Sem SLA";
  if (p.foraSla) return `Fora +${p.excessoMin} (limite ${p.slaMin} min)`;
  return `OK ${p.esperaAtendMin ?? 0}/${p.slaMin} min`;
}
function RiskBadge({ cor }: { cor: CorRisco }) {
  return <span className={cn("inline-flex shrink-0 items-center rounded px-2 py-1 text-xs font-bold", corChip[cor])}>{cor}</span>;
}
function SlaLabel({ patient }: { patient: PaPaciente }) {
  return <span className={cn("text-xs font-semibold", patient.slaMin == null ? "text-muted-foreground" : patient.foraSla ? "text-critical" : "text-success-strong")}>{slaText(patient)}</span>;
}
export function PatientTable({ rows, sort, onSort }: { rows: PaPaciente[]; sort: PatientSort; onSort: (key: ColKey) => void }) {
  return <div tabIndex={0} role="region" aria-label="Tabela de pacientes" className="hidden max-h-[70vh] overflow-auto rounded-md border border-border bg-card shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:block">
    <table className="w-full min-w-[1500px] text-sm">
      <caption className="sr-only">Pacientes do PA e tempos de espera</caption>
      <thead className="sticky top-0 z-10 bg-muted text-left text-xs text-muted-foreground"><tr>{cols.map(([k, label]) => <th key={label} scope="col" aria-sort={k && sort?.key === k ? sort.dir === 1 ? "ascending" : "descending" : undefined} className={cn("px-3 py-3 font-semibold", k === "paciente" && "min-w-[240px]", k === "sla" && "min-w-[180px]")}>
        {k ? <Button variant="ghost" onClick={() => onSort(k)} className={cn("h-auto justify-start whitespace-normal p-0 text-left text-xs", sort?.key === k && "text-primary")} aria-label={`Ordenar por ${label}`}>{label}{sort?.key === k ? sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-40" />}</Button> : label}
      </th>)}</tr></thead>
      <tbody>{rows.map((p) => <tr key={p.id} className={cn("border-t border-border transition-colors hover:bg-muted/60", p.foraSla && p.grupo !== "finalizado" && corRow[p.cor])}>
        <td className="px-3 py-3 font-mono text-xs font-bold">{p.senha}</td>
        <td className="max-w-[320px] whitespace-normal break-words px-3 py-3 font-semibold">{p.paciente}</td>
        <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{p.atendimento}</td>
        <td className="max-w-[200px] break-words px-3 py-3 text-xs">{p.especialidade}</td>
        <td className="px-3 py-3"><RiskBadge cor={p.cor} /></td>
        <td className="px-3 py-3"><StatusBadge status={p.situacao} /></td>
        <td className="px-3 py-3 font-mono text-xs">{p.chegada}</td>
        <td className="px-3 py-3 font-mono text-xs">{p.esperaClassif}</td>
        <td className="px-3 py-3 font-mono text-xs">{p.esperaAtendMed}</td>
        <td className="px-3 py-3 font-mono text-xs">{p.tempoTotal}</td>
        <td className="px-3 py-3"><SlaLabel patient={p} /></td>
      </tr>)}</tbody>
    </table>
  </div>;
}
export function PatientCards({ rows }: { rows: PaPaciente[] }) {
  return <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:hidden">{rows.map((p) => <article key={p.id} className={cn("min-w-0 rounded-md border border-border bg-card p-4 shadow-card", p.foraSla && p.grupo !== "finalizado" && "border-critical/50")}>
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3"><div className="min-w-0"><p className="font-mono text-xs font-semibold text-muted-foreground">{p.senha}</p><h3 className="mt-1 break-words text-sm font-bold leading-5">{p.paciente}</h3></div><RiskBadge cor={p.cor} /></div>
    <p className="mt-2 break-words text-xs text-muted-foreground">{p.especialidade}</p>
    <div className="mt-3"><StatusBadge status={p.situacao} /></div>
    <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3"><div><dt className="text-xs text-muted-foreground">Espera p/ médico</dt><dd className="mt-1 font-mono text-base font-semibold">{p.esperaAtendMed}</dd></div><div><dt className="text-xs text-muted-foreground">Tempo total</dt><dd className="mt-1 font-mono text-base font-semibold">{p.tempoTotal}</dd></div></dl>
    <div className="mt-3"><SlaLabel patient={p} /></div>
    <details className="group mt-3 border-t border-border pt-1"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Dados do atendimento</span><ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" /></summary>
      <dl className="grid grid-cols-2 gap-3 pb-1 text-xs"><div><dt className="text-muted-foreground">Atendimento</dt><dd className="mt-1 break-all font-mono">{p.atendimento}</dd></div><div><dt className="text-muted-foreground">Chegada</dt><dd className="mt-1 font-mono">{p.chegada}</dd></div><div className="col-span-2"><dt className="text-muted-foreground">Espera p/ classificação</dt><dd className="mt-1 font-mono">{p.esperaClassif}</dd></div></dl>
    </details>
  </article>)}</div>;
}