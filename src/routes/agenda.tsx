import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bed, Clock3, DoorOpen, UserCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Filters, MetricCard, StatusBadge } from "@/components/dashboard-ui";
import { DataError, PageSkeleton, formatGerado, usePainel } from "@/lib/use-painel";

export const Route = createFileRoute("/agenda")({ head: () => ({ meta: [{ title: "Agenda Cirúrgica — Centro Cirúrgico Materno" }, { name: "description", content: "Agenda diária e capacidade do bloco cirúrgico materno." }, { property: "og:title", content: "Agenda Cirúrgica — Centro Cirúrgico Materno" }, { property: "og:description", content: "Agenda diária e capacidade do bloco cirúrgico materno." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: Agenda });

function Agenda() {
  const [filter, setFilter] = useState("Dia inteiro");
  const { data, isPending, isError } = usePainel();
  if (isPending) return <PageSkeleton />;
  if (!data) return <div><PageHeader title="Agenda Cirúrgica" subtitle="—" /><DataError /></div>;
  const ind = data.agenda.indicadores;
  const rows = data.agenda.itens.map((i) => [i.horario, i.sala, i.procedimento, i.prioridade, i.situacao, i.duracao, i.proximaAcao]);
  return <div>{isError && <div className="mb-4"><DataError /></div>}<PageHeader title="Agenda Cirúrgica" subtitle={formatGerado(data.meta.geradoEm, false)} /><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><MetricCard label="Próxima sala disponível" value={ind.proximaSalaDisponivel} icon={DoorOpen} /><MetricCard label="Risco de sobreposição" value={`${ind.riscoSobreposicao} salas`} icon={Clock3} tone="warn" /><MetricCard label="Aptas para chamada" value={ind.aptasChamada} icon={UserCheck} tone="good" /><MetricCard label="Com pendências" value={ind.comPendencias} icon={Users} tone="warn" /><MetricCard label="Vagas na RPA" value={`${ind.vagasRpa} de ${ind.leitosRpa}`} icon={Bed} /></section><div className="my-6 flex flex-wrap items-center justify-between gap-3"><Filters options={["Dia inteiro", "Manhã", "Tarde"]} active={filter} onChange={setFilter} /><div className="flex gap-2"><select aria-label="Filtrar sala" className="select-field"><option>Todas as salas</option><option>Sala 01</option><option>Sala 02</option></select><select aria-label="Filtrar prioridade" className="select-field"><option>Todas as prioridades</option><option>Eletiva</option><option>Urgência</option></select></div></div><div className="overflow-hidden rounded-md border border-border bg-card shadow-card"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-muted text-xs uppercase text-muted-foreground"><tr>{["Horário", "Sala", "Procedimento", "Prioridade", "Situação", "Duração", "Próxima ação"].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i} className="border-t border-border hover:bg-muted/40">{row.map((cell, j) => <td key={j} className="px-4 py-4 font-medium">{j === 4 ? <StatusBadge status={cell} /> : <span className={j === 3 && (cell === "Urgência" || cell === "Emergência") ? "font-bold text-critical" : j === 0 || j === 5 ? "font-mono tabular-nums" : ""}>{cell}</span>}</td>)}</tr>)}</tbody></table></div></div></div>;
}
