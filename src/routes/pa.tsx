import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type React from "react";
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, Clock3, Download, Hourglass, RefreshCw, Search, Siren, Users, X } from "lucide-react";

import { StatusBadge } from "@/components/dashboard-ui";
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
  const { data, isPending, isError, refetch } = usePa();
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

  const [origem, setOrigem] = useState("Todas");
  const [ordem, setOrdem] = useState<"gravidade" | "sla" | "chegada" | "espera" | "paciente">("gravidade");
  const rows2 = useMemo(() => {
    const list = rows.filter((p) => origem === "Todas" || p.origem === origem);
    if (sort) return list;
    const cmp: Record<typeof ordem, (a: PaPaciente, b: PaPaciente) => number> = {
      gravidade: (a, b) => CORES.indexOf(a.cor) - CORES.indexOf(b.cor) || defaultSort(a, b),
      sla: defaultSort,
      chegada: (a, b) => hm(a.chegada).localeCompare(hm(b.chegada)),
      espera: (a, b) => (b.esperaAtendMin ?? -1) - (a.esperaAtendMin ?? -1),
      paciente: (a, b) => a.paciente.localeCompare(b.paciente),
    };
    return [...list].sort(cmp[ordem]);
  }, [rows, origem, ordem, sort]);

  const banner = (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-4 rounded-xl bg-primary p-6 text-primary-foreground shadow-card">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Centro Cirúrgico Materno · Monitoramento</p>
        <h1 className="mt-1 text-2xl font-extrabold">Pacientes do PA</h1>
        <p className="mt-1 text-sm opacity-90">Tempo de espera por classificação de risco{data ? ` · atualizado às ${horaSP(data.atualizadoEm)}` : ""}</p>
      </div>
      <div className="min-w-64 rounded-lg bg-primary-foreground/15 p-3 text-xs">
        <p className="flex items-center gap-2 font-bold uppercase"><span className="h-2 w-2 rounded-full bg-success" />Ao vivo</p>
        <p className="mt-1 opacity-90">Última atualização {data ? new Date(data.atualizadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—"} · atualização automática a cada 15 s</p>
        <div className="mt-2"><StaleNotice age={age} /></div>
      </div>
    </header>
  );
  if (isPending) return <PageSkeleton />;
  if (!data) return <div>{banner}<DataError /></div>;
  const info = (msg: string) => <div>{banner}<div className="flex items-center gap-2 rounded-md border border-border bg-card p-4 text-sm font-semibold text-muted-foreground shadow-card"><Clock3 className="h-4 w-4" />{msg}</div></div>;
  if (data.aguardando) return info("Aguardando o primeiro envio do PA");
  if (!pa || !pa.disponivel) return info("PA indisponível");

  const t = pa.totais;
  const espAlerta = pa.especialidades.filter((e) => e.foraSla > 0);
  const origens = [...new Set(pa.pacientes.map((p) => p.origem))].filter(Boolean);
  const toggleSort = (key: ColKey) => setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }));
  const finalizado = (p: PaPaciente) => p.grupo === "finalizado";

  const exportCsv = () => {
    const head = ["Paciente", "Atendimento", "Senha", "Especialidade", "Origem", "Cor", "Chegada", "Classif. início", "Classif. final", "Espera classif.", "Chamada médica", "Atend. méd. início", "Espera atend. méd.", "Status atual", "SLA", "Alta", "Tempo total", "Finalizado?"];
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [head, ...rows2.map((p) => [p.paciente, p.atendimento, p.senha, p.especialidade, p.origem, p.cor, p.chegada, p.classifInicio, p.classifFinal, p.esperaClassif, p.chamadaMedica, p.atendMedInicio, p.esperaAtendMed, p.situacao, slaText(p), p.alta, p.tempoTotal, finalizado(p) ? "Sim" : "Não"])].map((r) => r.map(esc).join(";"));
    const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `pacientes-pa-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const chip = (active: boolean) => cn("inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition", active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted");
  const card = (label: string, value: number, cls = "", extra?: React.ReactNode) => <div className={cn("rounded-xl border border-border bg-card p-4 shadow-card", cls)}><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-extrabold tabular-nums text-primary">{value}</p>{extra}</div>;
  const cols: [ColKey | null, string][] = [["paciente", "Paciente"], [null, "Atendimento"], ["senha", "Senha"], ["especialidade", "Especialidade"], [null, "Origem"], ["cor", "Cor"], ["chegada", "Chegada"], [null, "Classif. início"], [null, "Classif. final"], ["esperaClassifMin", "Espera classif."], [null, "Chamada médica"], [null, "Atend. méd. início"], ["esperaAtendMin", "Espera atend. méd."], ["situacao", "Status atual"], ["sla", "SLA"], [null, "Alta"], ["tempoTotalMin", "Tempo total"], [null, "Finalizado?"]];
  const cell = "px-3 py-2.5 whitespace-nowrap";

  return <div className="space-y-4">
    {isError && <DataError />}
    {banner}
    <div className="flex flex-wrap items-center gap-2">
      <select className="select-field min-w-56" value={origem} onChange={(e) => setOrigem(e.target.value)}><option value="Todas">Todas as origens</option>{origens.map((o) => <option key={o}>{o}</option>)}</select>
      <select className="select-field min-w-56" value={esp} onChange={(e) => setEsp(e.target.value)}><option value="Todas">Todas as especialidades</option>{pa.especialidades.map((e) => <option key={e.especialidade}>{e.especialidade}</option>)}</select>
      <button onClick={() => refetch()} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground"><RefreshCw className="h-4 w-4" />Atualizar</button>
      <button onClick={exportCsv} className="inline-flex h-10 items-center gap-2 rounded-full bg-success px-4 text-sm font-bold text-critical-foreground"><Download className="h-4 w-4" />Excel</button>
    </div>
    <div className="flex flex-wrap gap-2 text-xs font-semibold text-primary">
      <span className="rounded-full border border-border bg-card px-3 py-1">Origem: {origem === "Todas" ? "Todas as origens" : origem}</span>
      <span className="rounded-full border border-border bg-card px-3 py-1">Especialidade: {esp === "Todas" ? "Todas as especialidades" : esp}</span>
    </div>

    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {card("Total de pacientes", t.total)}
      {card("Especialidades", pa.especialidades.length)}
      {card("Laranja", t.porCor.Laranja ?? 0, "border-warning/50 bg-warning/5")}
      {card("Amarelo", t.porCor.Amarelo ?? 0, "border-caution/60 bg-caution/10")}
      {card("Verde / Azul", (t.porCor.Verde ?? 0) + (t.porCor.Azul ?? 0))}
      {card("Pacientes fora do SLA", t.foraSla, t.foraSla > 0 ? "border-critical/50 bg-critical/10 ring-2 ring-critical/20" : "", espAlerta.length > 0 && <div className="mt-2 text-[11px] font-bold uppercase text-critical"><p>Especialidades em alerta</p>{espAlerta.map((e) => <p key={e.especialidade}>{e.especialidade} ({e.foraSla})</p>)}</div>)}
    </section>

    <section className="rounded-xl border border-border bg-card p-4 shadow-card">
      <h2 className="font-bold">Distribuição por risco</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {(["Vermelho", "Laranja", "Amarelo", "Verde", "Azul"] as CorRisco[]).map((c) => <button key={c} onClick={() => setCor((v) => (v === c ? "Todas" : c))} aria-pressed={cor === c} className={cn("inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-bold", corRow[c], cor !== "Todas" && cor !== c && "opacity-40", cor === c && "ring-2 ring-primary")}>
          <span className={cn("h-3 w-3 rounded-full", corBar[c])} />{c} ({pa.limites[c] ?? 0} min) · {t.porCor[c] ?? 0}
        </button>)}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {pa.especialidades.map((e) => <article key={e.especialidade} className="min-w-64 overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between gap-4 bg-primary/80 px-3 py-2 text-xs font-bold uppercase text-primary-foreground"><span>{e.especialidade}</span><span className="text-[10px] normal-case opacity-90">Pacientes: {e.total}</span></div>
          <div className="flex gap-2 p-3">{(["Laranja", "Amarelo", "Verde", "Azul"] as CorRisco[]).map((c) => <div key={c} className="w-14 rounded-md border border-border py-2 text-center"><p className="text-lg font-extrabold tabular-nums">{e.porCor[c] ?? 0}</p><p className="text-[10px] text-muted-foreground">{c}</p></div>)}</div>
          {e.foraSla > 0 && <p className="px-3 pb-2 text-xs font-bold text-critical">{e.foraSla} fora do SLA</p>}
        </article>)}
      </div>
    </section>

    <section className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">Pacientes</h2>
        <div className="flex gap-3 text-[11px] text-muted-foreground">{[["bg-critical", "Fora do SLA"], ["bg-caution", "Em espera"], ["bg-cleaning", "Em curso"], ["bg-success", "Finalizado"]].map(([c, l]) => <span key={l} className="inline-flex items-center gap-1"><span className={cn("h-2 w-2 rounded-full", c)} />{l}</span>)}</div>
      </div>
      <div className="mt-3 space-y-3 rounded-xl border border-border p-4">
        <span className="relative block max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por senha ou iniciais..." className="select-field w-full rounded-full pl-9" />{q && <button onClick={() => setQ("")} aria-label="Limpar" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="h-4 w-4" /></button>}</span>
        <div className="flex flex-wrap items-center gap-2"><span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ordenar:</span>
          {([["gravidade", "Gravidade", AlertTriangle], ["sla", "Fora SLA", Siren], ["chegada", "Chegada", Clock3], ["espera", "Espera", Hourglass], ["paciente", "Paciente", Users]] as const).map(([k, l, I]) => <button key={k} onClick={() => { setOrdem(k); setSort(null); }} className={chip(!sort && ordem === k)}><I className="h-3 w-3" />{l}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-2"><span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status:</span>
          {([["Todos", "Todos"], ["Fora do SLA", "Fora SLA"], ["Em curso", "Em curso"], ["Aguardando", "Aguardando"], ["Finalizado", "Finalizados"]] as const).map(([k, l]) => <button key={k} onClick={() => setSit(k)} className={chip(sit === k)}>{l}</button>)}
        </div>
        <p className="text-right text-xs font-semibold text-primary">{rows2.length} de {pa.pacientes.length} pacientes{rows2.length !== pa.pacientes.length ? " (filtrado)" : ""}</p>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[1700px] text-xs">
          <thead className="bg-primary/10 text-left text-primary"><tr>{cols.map(([k, label]) => <th key={label} className="whitespace-nowrap px-3 py-2.5 font-bold">{k ? <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1">{label}{sort?.key === k ? (sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}</button> : label}</th>)}</tr></thead>
          <tbody>
            {rows2.length === 0 && <tr><td colSpan={cols.length} className="px-3 py-6 text-center text-muted-foreground">Nenhum paciente para os filtros selecionados.</td></tr>}
            {rows2.map((p) => <tr key={p.id} className={cn("border-t border-border", p.foraSla && !finalizado(p) && corRow[p.cor])}>
              <td className={cn(cell, "font-bold uppercase")}>{p.paciente}</td>
              <td className={cn(cell, "font-mono")}>{p.atendimento}</td>
              <td className={cn(cell, "font-mono")}>{p.senha}</td>
              <td className={cn(cell, "uppercase")}>{p.especialidade}</td>
              <td className={cn(cell, "uppercase")}>{p.origem}</td>
              <td className={cell}><span className={cn("inline-flex rounded-full border border-border px-2.5 py-1 text-[10px] font-extrabold uppercase", corRow[p.cor])}>{p.cor}</span></td>
              <td className={cell}>{p.chegada}</td>
              <td className={cell}>{p.classifInicio}</td>
              <td className={cell}>{p.classifFinal}</td>
              <td className={cell}>{p.esperaClassif}</td>
              <td className={cell}>{p.chamadaMedica}</td>
              <td className={cell}>{p.atendMedInicio}</td>
              <td className={cn(cell, "font-bold")}>{p.esperaAtendMed}</td>
              <td className={cell}><StatusBadge status={p.situacao} /></td>
              <td className={cell}><span className={cn("inline-flex rounded-lg border px-2 py-1 text-[10px] font-bold", p.slaMin == null ? "border-border text-muted-foreground" : p.foraSla ? "border-critical/40 bg-critical/10 text-critical" : "border-success/40 bg-success/10 text-success-strong")}>{slaText(p)}</span></td>
              <td className={cell}>{p.alta}</td>
              <td className={cell}>{p.tempoTotal}</td>
              <td className={cell}><span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold", finalizado(p) ? "border-success/40 bg-success/10 text-success-strong" : "border-caution/60 bg-caution/15")}>{finalizado(p) ? <CheckCircle2 className="h-3 w-3" /> : <Hourglass className="h-3 w-3" />}{finalizado(p) ? "Sim" : "Não"}</span></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>
  </div>;
}
