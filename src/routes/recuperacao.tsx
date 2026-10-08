import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Bed, Clock3, HeartPulse } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { MetricCard, StatusBadge } from "@/components/dashboard-ui";
import { DataError, PageSkeleton, usePainel } from "@/lib/use-painel";

export const Route = createFileRoute("/recuperacao")({ head: () => ({ meta: [{ title: "Recuperação Pós-Anestésica — Centro Cirúrgico Materno" }, { name: "description", content: "Ocupação e situação dos leitos de recuperação pós-anestésica." }, { property: "og:title", content: "Recuperação Pós-Anestésica — Centro Cirúrgico Materno" }, { property: "og:description", content: "Ocupação e situação dos leitos de recuperação pós-anestésica." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: Recuperacao });

function Recuperacao() {
  const { data, isPending, isError } = usePainel();
  const header = <PageHeader title="Recuperação Pós-Anestésica" subtitle="Capacidade, permanência e transferências da RPA" />;
  if (isPending) return <PageSkeleton />;
  if (!data) return <div>{header}<DataError /></div>;
  if (!data.rpa.disponivel) return <div>{header}<div className="flex items-center gap-2 rounded-md border border-border bg-card p-4 text-sm font-semibold text-muted-foreground shadow-card"><AlertTriangle className="h-4 w-4" />RPA indisponível</div></div>;
  const beds = data.rpa.leitos;
  const occ = beds.filter((b) => b.occupied).length;
  const pct = beds.length ? (occ / beds.length) * 100 : 0;
  return <div>{isError && <div className="mb-4"><DataError /></div>}<div className="flex flex-wrap items-start justify-between gap-4">{header}<div className="w-full sm:w-auto"><MetricCard label="Ocupação geral" value={`${occ} de ${beds.length} leitos`} icon={Bed} tone="good" /></div></div><div className="mb-6 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} /></div><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{beds.map((b) => <article key={b.bed} className="rounded-md border border-border bg-card shadow-card"><div className="flex items-center justify-between border-b border-border p-4"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-md bg-muted"><Bed className="h-4 w-4" /></span><h2 className="font-bold">{b.bed}</h2></div><StatusBadge status={b.state} /></div><div className="grid grid-cols-2 gap-4 p-4 text-sm"><Field label="Paciente" value={b.patient} /><Field label="Sala de origem" value={b.origin} /><Field label="Entrada" value={b.enter} /><Field label="Permanência" value={b.stay} mono /><div className="col-span-2"><Field label="Destino previsto" value={b.dest} /></div></div>{b.occupied && <div className="flex items-center gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground"><HeartPulse className="h-4 w-4" />Última avaliação há 8 minutos <Clock3 className="ml-auto h-4 w-4" /></div>}</article>)}</section></div>;
}
function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 font-semibold ${mono ? "font-mono" : ""}`}>{value}</p></div>; }
