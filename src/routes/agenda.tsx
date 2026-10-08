import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bed, Clock3, DoorOpen, UserCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Filters, MetricCard, StatusBadge } from "@/components/dashboard-ui";
import { DataError, PageSkeleton, usePainel } from "@/lib/use-painel";

export const Route = createFileRoute("/agenda")({ head: () => ({ meta: [{ title: "Agenda Cirúrgica — Centro Cirúrgico Materno" }, { name: "description", content: "Agenda diária e capacidade do bloco cirúrgico materno." }, { property: "og:title", content: "Agenda Cirúrgica — Centro Cirúrgico Materno" }, { property: "og:description", content: "Agenda diária e capacidade do bloco cirúrgico materno." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: Agenda });

const ALL_ROOMS = "Todas as salas";
const ALL_PRIO = "Todas as prioridades";

function Agenda() {
  const [filter, setFilter] = useState("Dia inteiro");
  const [sala, setSala] = useState(ALL_ROOMS);
  const [prio, setPrio] = useState(ALL_PRIO);
  const { data, isPending, isError } = usePainel();
  if (isPending) return <PageSkeleton />;
  if (!data) return <div><PageHeader title="Agenda Cirúrgica" subtitle="—" /><DataError /></div>;
  const ind = data.agenda.indicadores;
  const linhas = data.agenda.linhas;
  const salas = [...new Set(linhas.map((l) => l.sala))].sort();
  const prios = [...new Set(linhas.map((l) => l.prioridade))];
  const visible = linhas.filter((l) => (filter === "Dia inteiro" || l.turno === filter) && (sala === ALL_ROOMS || l.sala === sala) && (prio === ALL_PRIO || l.prioridade === prio));
  const rows = visible.map((i) => ({ id: i.id, cells: [i.horario, i.sala, i.procedimento, i.prioridade, i.situacao, i.duracao, i.proximaAcao] }));
  return <div>{isError && <div className="mb-4"><DataError /></div>}<PageHeader title="Agenda Cirúrgica" subtitle={data.resumo.dataReferencia} /><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><MetricCard label="Próxima sala disponível" value={`${ind.proximaSalaDisponivel.sala} · ${ind.proximaSalaDisponivel.hora}`} icon={DoorOpen} /><MetricCard label="Risco de sobreposição" value={`${ind.salasComRiscoDeSobreposicao} salas`} icon={Clock3} tone="warn" /><MetricCard label="Aptas para chamada" value={ind.aptasParaChamada} icon={UserCheck} tone="good" /><MetricCard label="Com pendências" value={ind.comPendencias} icon={Users} tone="warn" /><MetricCard label="Vagas na RPA" value={`${ind.vagasRpa.livres} de ${ind.vagasRpa.total}`} icon={Bed} /></section><div className="my-6 flex flex-wrap items-center justify-between gap-3"><Filters options={["Dia inteiro", "Manhã", "Tarde"]} active={filter} onChange={setFilter} /><div className="flex gap-2"><select aria-label="Filtrar sala" className="select-field" value={sala} onChange={(e) => setSala(e.target.value)}><option>{ALL_ROOMS}</option>{salas.map((s) => <option key={s}>{s}</option>)}</select><select aria-label="Filtrar prioridade" className="select-field" value={prio} onChange={(e) => setPrio(e.target.value)}><option>{ALL_PRIO}</option>{prios.map((p) => <option key={p}>{p}</option>)}</select></div></div><div className="overflow-hidden rounded-md border border-border bg-card shadow-card"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-muted text-xs uppercase text-muted-foreground"><tr>{["Horário", "Sala", "Procedimento", "Prioridade", "Situação", "Duração", "Próxima ação"].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-border hover:bg-muted/40">{row.cells.map((cell, j) => <td key={j} className="px-4 py-4 font-medium">{j === 4 ? <StatusBadge status={cell} /> : <span className={j === 3 && (cell === "Urgência" || cell === "Emergência") ? "font-bold text-critical" : j === 0 || j === 5 ? "font-mono tabular-nums" : ""}>{cell}</span>}</td>)}</tr>)}{rows.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Nenhum procedimento para os filtros selecionados.</td></tr>}</tbody></table></div></div></div>;
}
