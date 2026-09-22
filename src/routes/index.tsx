import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, Clock3, DoorOpen, ListChecks, Sparkles, TriangleAlert } from "lucide-react";
import { Filters, MetricCard, RoomCard } from "@/components/dashboard-ui";
import { PageHeader } from "@/components/app-shell";
import { rooms } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Painel de Salas — Centro Cirúrgico Materno" },
    { name: "description", content: "Situação operacional das salas cirúrgicas da maternidade." },
    { property: "og:title", content: "Painel de Salas — Centro Cirúrgico Materno" },
    { property: "og:description", content: "Situação operacional das salas cirúrgicas da maternidade." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

function Index() {
  const [filter, setFilter] = useState("Todas as salas");
  const filtered = rooms.filter((room) => filter === "Todas as salas" || (filter === "Cesáreas" && room.category === "Cesárea") || (filter === "Emergência" && ["Urgência", "Emergência"].includes(room.priority)) || (filter === "Em atraso" && room.status === "Em atraso"));
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4"><PageHeader title="Bloco Cirúrgico — Maternidade" subtitle="Terça-feira, 22 de setembro de 2026 · 10:50" /><Filters options={["Todas as salas", "Cesáreas", "Emergência", "Em atraso"]} active={filter} onChange={setFilter} /></div>
      <section aria-label="Resumo operacional" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6"><MetricCard label="Salas totais" value={6} icon={DoorOpen} /><MetricCard label="Em cirurgia" value={3} icon={Activity} tone="good" /><MetricCard label="Em preparo" value={1} icon={Clock3} /><MetricCard label="Em limpeza" value={1} icon={Sparkles} /><MetricCard label="Salas livres" value={1} icon={DoorOpen} /><MetricCard label="Ocupação" value="83%" icon={Activity} tone="good" /></section>
      <section className="mt-3 grid grid-cols-3 gap-3"><MetricCard label="Procedimentos previstos" value={12} icon={ListChecks} /><MetricCard label="Realizados" value={5} icon={Activity} tone="good" /><MetricCard label="Atrasados" value={2} icon={TriangleAlert} tone="warn" /></section>
      <div className="mb-3 mt-7 flex items-center justify-between"><div><h2 className="text-lg font-bold">Situação das salas</h2><p className="text-xs text-muted-foreground">Selecione uma sala para consultar o detalhamento</p></div><span className="text-xs font-semibold text-muted-foreground">{filtered.length} salas exibidas</span></div>
      <section className="grid gap-4 xl:grid-cols-2">{filtered.map((room) => <RoomCard key={room.id} room={room} />)}</section>
    </div>
  );
}
