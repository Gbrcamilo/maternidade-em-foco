import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, Clock3, Download, Hourglass, Search, Stethoscope, Users } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { MetricCard, StatusBadge } from "@/components/dashboard-ui";
import { DataError, PageSkeleton, StaleNotice, useAge, usePa } from "@/lib/use-painel";
import type { CorRisco, PaPaciente } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pa")({
  head: () => ({ meta: [
    { title: "Pacientes do PA — Centro Cirúrgico Materno" },
    { name: "description", content: "Tempo de espera do pronto atendimento obstétrico por classificação de risco." },
    { property: "og:title", content: "Pacientes do PA — Centro Cirúrgico Materno" },
    { property: "og:description", content: "Tempo de espera do pronto atendimento obstétrico por classificação de risco." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: PaPage,
});

const CORES: CorRisco[] = ["Vermelho", "Laranja", "Amarelo", "Verde", "Azul", "Sem cor"];
const corChip: Record<CorRisco, string> = {
  Vermelho: "bg-critical text-critical-foreground",
  Laranja: "bg-warning text-critical-foreground",
  Amarelo: "bg-caution text-foreground",
  Verde: "bg-success text-critical-foreground",
  Azul: "bg-cleaning text-critical-foreground",
  "Sem cor": "bg-muted text-muted-foreground",
};
const corBar: Record<CorRisco, string> = { Vermelho: "bg-critical", Laranja: "bg-warning", Amarelo: "bg-caution", Verde: "bg-success", Azul: "bg-cleaning", "Sem cor": "bg-muted-foreground/40" };
const corRow: Record<CorRisco, string> = { Vermelho: "bg-critical/10", Laranja: "bg-warning/15", Amarelo: "bg-caution/20", Verde: "bg-success/10", Azul: "bg-cleaning/15", "Sem cor": "bg-muted" };
const SITUACOES = ["Todos", "Aguardando", "Em curso", "Finalizado", "Fora do SLA"] as const;
type ColKey = "senha" | "paciente" | "especialidade" | "cor" | "situacao" | "chegada" | "esperaClassifMin" | "esperaAtendMin" | "tempoTotalMin" | "sla";

function slaText(p: PaPaciente) {
  if (p.slaMin == null) return "Sem SLA";
  if (p.foraSla) return `Fora +${p.excessoMin} (limite ${p.slaMin} min)`;
  return `OK ${p.esperaAtendMin ?? 0}/${p.slaMin} min`;
}
const horaSP = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
const hm = (s: string) => (/^\d{2}:\d{2}$/.test(s) ? s : "99:99");

function defaultSort(a: PaPaciente, b: PaPaciente) {
  if (a.foraSla !== b.foraSla) return a.foraSla ? -1 : 1;
  if (a.foraSla && b.foraSla && a.excessoMin !== b.excessoMin) return b.excessoMin - a.excessoMin;
  return hm(a.chegada).localeCompare(hm(b.chegada));
}

function PaPage() {
  const { data, isPending, isError } = usePa();
  const age = useAge(data?.atualizadoEm);
  const [esp, setEsp] = useState("Todas");
  const [cor, setCor] = useState<CorRisco | "Todas">("Todas");
  const [sit, setSit] = useState<(typeof SITUACOES)[number]>("Todos");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: ColKey; dir: 1 | -1 } | null>(null);

  const pa = data && !data.aguardando ? data.pa : null;
  const rows = useMemo(() => {
    if (!pa?.disponivel) return [];
    const term = q.trim().toLowerCase();
    const list = pa.pacientes.filter((p) =>
      (esp === "Todas" || p.especialidade === esp) &&
      (cor === "Todas" || p.cor === cor) &&
      (sit === "Todos" || (sit === "Aguardando" && p.grupo === "aguardando") || (sit === "Em curso" && p.grupo === "em-curso") || (sit === "Finalizado" && p.grupo === "finalizado") || (sit === "Fora do SLA" && p.foraSla)) &&
      (!term || p.senha.toLowerCase().includes(term) || p.paciente.toLowerCase().includes(term)));
    if (!sort) return list.sort(defaultSort);
    const val = (p: PaPaciente): string | number => {
      switch (sort.key) {
        case "cor": return CORES.indexOf(p.cor);
        case "chegada": return hm(p.chegada);
        case "esperaClassifMin": case "esperaAtendMin": case "tempoTotalMin": return p[sort.key] ?? -1;
        case "sla": return p.foraSla ? 100000 + p.excessoMin : p.slaMin == null ? -1 : p.esperaAtendMin ?? 0;
        default: return p[sort.key].toLowerCase();
      }
    };
    return list.sort((a, b) => { const x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * sort.dir; });
  }, [pa, esp, cor, sit, q, sort]);

  const subtitle = `Tempo de espera por classificação de risco${data ? ` · atualizado às ${horaSP(data.atualizadoEm)}` : ""}`;
  const header = <div className="flex flex-wrap items-start justify-between gap-3"><PageHeader title="Pacientes do PA" subtitle={subtitle} /><StaleNotice age={age} /></div>;
  if (isPending) return <PageSkeleton />;
  if (!data) return <div>{header}<DataError /></div>;
  const info = (msg: string) => <div>{header}<div className="flex items-center gap-2 rounded-md border border-border bg-card p-4 text-sm font-semibold text-muted-foreground shadow-card"><Clock3 className="h-4 w-4" />{msg}</div></div>;
  if (data.aguardando) return info("Aguardando o primeiro envio do PA");
  if (!pa || !pa.disponivel) return info("PA indisponível");

  const t = pa.totais;
  const espAlerta = pa.especialidades.filter((e) => e.foraSla > 0);
  const toggleSort = (key: ColKey) => setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }));

  const exportCsv = () => {
    const head = ["Senha", "Paciente", "Atendimento", "Especialidade", "Risco", "Situação", "Chegada", "Espera p/ classificação", "Espera p/ médico", "Tempo total", "SLA"];
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [head, ...rows.map((p) => [p.senha, p.paciente, p.atendimento, p.especialidade, p.cor, p.situacao, p.chegada, p.esperaClassif, p.esperaAtendMed, p.tempoTotal, slaText(p)])].map((r) => r.map(esc).join(";"));
    const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `pacientes-pa-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const cols: [ColKey | null, string][] = [["senha", "Senha"], ["paciente", "Paciente"], [null, "Atendimento"], ["especialidade", "Especialidade"], ["cor", "Risco"], ["situacao", "Situação"], ["chegada", "Chegada"], ["esperaClassifMin", "Espera p/ classificação"], ["esperaAtendMin", "Espera p/ médico"], ["tempoTotalMin", "Tempo total"], ["sla", "SLA"]];

  return <div className="space-y-6">
    {isError && <DataError />}
    {header}
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <MetricCard label="Total de pacientes" value={t.total} icon={Users} />
      <MetricCard label="Aguardando" value={t.aguardando} icon={Hourglass} tone="warn" />
      <MetricCard label="Em curso" value={t.emCurso} icon={Stethoscope} />
      <MetricCard label="Finalizados" value={t.finalizados} icon={CheckCircle2} tone="good" />
      <div className={cn("col-span-2 rounded-md border bg-card p-4 shadow-card md:col-span-1", t.foraSla > 0 ? "animate-pulse border-critical bg-critical/10" : "border-border")}>
        <div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-muted-foreground">Fora do SLA</p><p className={cn("mt-1 text-2xl font-bold tabular-nums", t.foraSla > 0 ? "text-critical" : "text-foreground")}>{t.foraSla}</p></div><span className={cn("grid h-9 w-9 place-items-center rounded-md", t.foraSla > 0 ? "bg-critical text-critical-foreground" : "bg-muted text-muted-foreground")}><AlertTriangle className="h-4 w-4" /></span></div>
        {espAlerta.length > 0 && <ul className="mt-2 space-y-0.5 text-xs">{espAlerta.map((e) => <li key={e.especialidade} className="flex justify-between gap-2"><span className="truncate">{e.especialidade}</span><span className="font-bold text-critical">{e.foraSla}</span></li>)}</ul>}
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="text-lg font-bold">Distribuição por risco</h2>
      <div className="flex flex-wrap gap-2">
        {CORES.filter((c) => c !== "Sem cor" || t.porCor["Sem cor"] > 0).map((c) => <button key={c} onClick={() => setCor((v) => (v === c ? "Todas" : c))} aria-pressed={cor === c} className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold transition", corChip[c], cor !== "Todas" && cor !== c && "opacity-40", cor === c && "ring-2 ring-foreground ring-offset-2 ring-offset-background")}>
          {c}{pa.limites[c] != null && <span className="font-medium opacity-90">({pa.limites[c]} min)</span>}<span className="rounded-full bg-background/30 px-2 tabular-nums">{t.porCor[c] ?? 0}</span>
        </button>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {pa.especialidades.map((e) => <article key={e.especialidade} className="rounded-md border border-border bg-card p-4 shadow-card">
          <div className="flex items-start justify-between gap-2"><h3 className="font-bold">{e.especialidade}</h3><span className="text-2xl font-bold tabular-nums">{e.total}</span></div>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted">{CORES.map((c) => e.total > 0 && (e.porCor[c] ?? 0) > 0 ? <div key={c} className={corBar[c]} style={{ width: `${((e.porCor[c] ?? 0) / e.total) * 100}%` }} title={`${c}: ${e.porCor[c]}`} /> : null)}</div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">{CORES.filter((c) => (e.porCor[c] ?? 0) > 0).map((c) => <span key={c} className="inline-flex items-center gap-1"><span className={cn("h-2 w-2 rounded-full", corBar[c])} />{c} {e.porCor[c]}</span>)}</div>
          <p className={cn("mt-2 text-xs font-semibold", e.foraSla > 0 ? "text-critical" : "text-success-strong")}>{e.foraSla > 0 ? `${e.foraSla} fora do SLA` : "Todos dentro do SLA"}</p>
        </article>)}
      </div>
    </section>

    <section className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-muted-foreground">Especialidade<select className="select-field mt-1 block" value={esp} onChange={(e) => setEsp(e.target.value)}><option>Todas</option>{pa.especialidades.map((e) => <option key={e.especialidade}>{e.especialidade}</option>)}</select></label>
        <label className="text-xs font-semibold text-muted-foreground">Risco<select className="select-field mt-1 block" value={cor} onChange={(e) => setCor(e.target.value as CorRisco | "Todas")}><option>Todas</option>{CORES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="text-xs font-semibold text-muted-foreground">Situação<select className="select-field mt-1 block" value={sit} onChange={(e) => setSit(e.target.value as (typeof SITUACOES)[number])}>{SITUACOES.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="text-xs font-semibold text-muted-foreground">Buscar<span className="relative mt-1 block"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Senha ou iniciais" className="select-field pl-8" /></span></label>
        <button onClick={exportCsv} className="ml-auto inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold hover:bg-muted"><Download className="h-4 w-4" />Exportar CSV</button>
      </div>
      <div className="overflow-x-auto rounded-md border border-border bg-card shadow-card">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground"><tr>{cols.map(([k, label]) => <th key={label} className="px-3 py-2.5 font-semibold">{k ? <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-foreground">{label}{sort?.key === k && (sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}</button> : label}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={11} className="px-3 py-6 text-center text-muted-foreground">Nenhum paciente para os filtros selecionados.</td></tr>}
            {rows.map((p) => <tr key={p.id} className={cn("border-t border-border", p.foraSla && p.grupo !== "finalizado" && corRow[p.cor])}>
              <td className="px-3 py-2.5 font-mono font-bold">{p.senha}</td>
              <td className="px-3 py-2.5 font-semibold">{p.paciente}</td>
              <td className="px-3 py-2.5 font-mono text-muted-foreground">{p.atendimento}</td>
              <td className="px-3 py-2.5">{p.especialidade}</td>
              <td className="px-3 py-2.5"><span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold", corChip[p.cor])}>{p.cor}</span></td>
              <td className="px-3 py-2.5"><StatusBadge status={p.situacao} /></td>
              <td className="px-3 py-2.5 font-mono">{p.chegada}</td>
              <td className="px-3 py-2.5 font-mono">{p.esperaClassif}</td>
              <td className="px-3 py-2.5 font-mono">{p.esperaAtendMed}</td>
              <td className="px-3 py-2.5 font-mono">{p.tempoTotal}</td>
              <td className={cn("px-3 py-2.5 text-xs font-bold", p.slaMin == null ? "text-muted-foreground" : p.foraSla ? "text-critical" : "text-success-strong")}>{slaText(p)}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{rows.length} de {pa.pacientes.length} pacientes</p>
    </section>
  </div>;
}
