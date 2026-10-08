import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, CircleAlert, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { AlertCard, Filters, MetricCard } from "@/components/dashboard-ui";
import { DataError, PageSkeleton, usePainel } from "@/lib/use-painel";

export const Route = createFileRoute("/alertas")({ head: () => ({ meta: [{ title: "Alertas Operacionais — Centro Cirúrgico Materno" }, { name: "description", content: "Alertas e pendências operacionais do centro cirúrgico materno." }, { property: "og:title", content: "Alertas Operacionais — Centro Cirúrgico Materno" }, { property: "og:description", content: "Alertas e pendências operacionais do centro cirúrgico materno." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: Alertas });

function Alertas() {
  const [filter, setFilter] = useState("Todos");
  const [viewed, setViewed] = useState<string[]>([]);
  const { data, isPending, isError } = usePainel();
  const header = <PageHeader title="Alertas Operacionais" subtitle="Pendências que requerem acompanhamento da coordenação" />;
  if (isPending) return <PageSkeleton />;
  if (!data) return <div>{header}<DataError /></div>;
  const alerts = data.alertas;
  const visible = alerts.filter((a) => filter === "Todos" || a.priority === filter);
  return <div>{isError && <div className="mb-4"><DataError /></div>}{header}<section className="mb-6 grid grid-cols-3 gap-3"><MetricCard label="Críticos" value={alerts.filter((a) => a.priority === "Crítico").length} icon={CircleAlert} tone="warn" /><MetricCard label="Alta prioridade" value={alerts.filter((a) => a.priority === "Alto").length} icon={TriangleAlert} tone="warn" /><MetricCard label="Total em aberto" value={alerts.length} icon={Bell} /></section><div className="mb-4"><Filters options={["Todos", "Crítico", "Alto", "Médio"]} active={filter} onChange={setFilter} /></div><div className="space-y-3">{visible.map((alert) => <AlertCard key={alert.id} {...alert} viewed={viewed.includes(alert.id)} onView={() => setViewed((v) => [...v, alert.id])} />)}</div></div>;
}
