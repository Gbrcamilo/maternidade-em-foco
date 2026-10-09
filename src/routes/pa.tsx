import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { AlertTriangle, CheckCircle2, Clock3, Download, Hourglass, Search, Stethoscope, Users, RotateCcw, SearchX, X, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/app-shell";

import { MetricCard } from "@/components/dashboard-ui";
import { DataError, PageSkeleton, usePa } from "@/lib/use-painel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CORES, corChip, corBar, cols, slaText, PatientTable, PatientCards, type ColKey, type PatientSort } from "@/components/pa-patients";
import type { CorRisco, PaPaciente } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { PaAnalysis } from "@/components/pa-analysis";
import { AlertasGestorBar } from "@/lib/use-voz-sla";

export const Route = createFileRoute("/pa")({
  head: () => ({ meta: [
    { title: "Pacientes do PA — Maternidade em Foco" },
    { name: "description", content: "Tempo de espera do pronto atendimento obstétrico por classificação de risco." },
    { property: "og:title", content: "Pacientes do PA — Maternidade em Foco" },
    { property: "og:description", content: "Tempo de espera do pronto atendimento obstétrico por classificação de risco." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: PaPage,
});

const SITUACOES = ["Todos", "Aguardando", "Em curso", "Finalizado", "Fora do SLA"] as const;

const horaSP = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
const hm = (s: string) => (/^\d{2}:\d{2}$/.test(s) ? s : "99:99");
const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

function defaultSort(a: PaPaciente, b: PaPaciente) {
  if (a.foraSla !== b.foraSla) return a.foraSla ? -1 : 1;
  if (a.foraSla && b.foraSla && a.excessoMin !== b.excessoMin) return b.excessoMin - a.excessoMin;
  return hm(a.chegada).localeCompare(hm(b.chegada));
}

function PaPage() {
  return <><PaDataPage /><PaAnalysis /></>;
}

function PaDataPage() {
  const { data, isPending, isError } = usePa();
  const [esp, setEsp] = useState("Todas");
  const [cor, setCor] = useState<CorRisco | "Todas">("Todas");
  const [sit, setSit] = useState<(typeof SITUACOES)[number]>("Todos");
  const [q, setQ] = useState("");
  const [specialtiesOpen, setSpecialtiesOpen] = useState(true);
  const [sort, setSort] = useState<PatientSort>(null);

  const pa = data && !data.aguardando ? data.pa : null;
  const rows = useMemo(() => {
    if (!pa?.disponivel) return [];
    const term = norm(q.trim());
    const list = pa.pacientes.filter((p) =>
      (esp === "Todas" || p.especialidade === esp) &&
      (cor === "Todas" || p.cor === cor) &&
      (sit === "Todos" || (sit === "Aguardando" && p.grupo === "aguardando") || (sit === "Em curso" && p.grupo === "em-curso") || (sit === "Finalizado" && p.grupo === "finalizado") || (sit === "Fora do SLA" && p.foraSla)) &&
      (!term || norm(p.senha).includes(term) || norm(p.paciente).includes(term) || norm(p.atendimento).includes(term)));
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
  const header = <div className="min-w-0 space-y-3"><PageHeader title="Pacientes do PA" subtitle={subtitle} /><AlertasGestorBar foraSla={pa?.disponivel ? pa.totais.foraSla : undefined} /></div>;
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

  const hasFilters = esp !== "Todas" || cor !== "Todas" || sit !== "Todos" || q.trim() !== "";
  const clearFilters = () => { setEsp("Todas"); setCor("Todas"); setSit("Todos"); setQ(""); };

  return <div className="min-w-0 space-y-6 md:space-y-7">
    {isError && <DataError />}
    {header}
    <section aria-label="Resumo dos pacientes" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
      <MetricCard label="Total de pacientes" value={t.total} icon={Users} />
      <MetricCard label="Aguardando" value={t.aguardando} icon={Hourglass} tone="warn" />
      <MetricCard label="Em curso" value={t.emCurso} icon={Stethoscope} />
      <MetricCard label="Finalizados" value={t.finalizados} icon={CheckCircle2} tone="good" />
      <div className={cn("col-span-2 min-w-0 rounded-md border bg-card p-4 shadow-card sm:col-span-1", t.foraSla > 0 ? "border-critical bg-critical/5" : "border-border")}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2"><div className="min-w-0"><p className="text-xs font-semibold text-muted-foreground">Fora do SLA</p><p className={cn("mt-1 text-3xl font-bold tabular-nums", t.foraSla > 0 ? "text-critical" : "text-foreground")}>{t.foraSla}</p></div><span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-md", t.foraSla > 0 ? "bg-critical text-critical-foreground" : "bg-muted text-muted-foreground")}><AlertTriangle className={cn("h-4 w-4", t.foraSla > 0 && "animate-pulse")} /></span></div>
        {espAlerta.length > 0 && <><ul className="mt-2 space-y-1 text-xs">{espAlerta.map((e) => <li key={e.especialidade} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"><span className="break-words">{e.especialidade}</span><span className="font-bold text-critical">{e.foraSla}</span></li>)}</ul><Button variant="link" size="sm" className="mt-1 h-8 px-0 text-critical" onClick={() => setSit("Fora do SLA")}>Ver pacientes em atraso</Button></>}
      </div>
    </section>

    <section aria-labelledby="risk-title" className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"><h2 id="risk-title" className="text-base font-bold md:text-lg">Distribuição por risco</h2><span className="text-xs text-muted-foreground">{t.total} pacientes</span></div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" role="group" aria-label="Filtrar por classificação de risco">
        {CORES.filter((c) => (c !== "Sem cor" && c !== "Branco") || (t.porCor[c] ?? 0) > 0).map((c) => <Button key={c} variant="ghost" onClick={() => setCor((v) => v === c ? "Todas" : c)} aria-pressed={cor === c} className={cn("h-11 justify-between gap-2 rounded-md px-3 text-xs hover:opacity-90 sm:min-w-[145px]", corChip[c], cor !== "Todas" && cor !== c && "opacity-50", cor === c && "ring-2 ring-foreground ring-offset-2 ring-offset-background")}>
          <span className="inline-flex items-center gap-1.5">{c}{c !== "Branco" && pa.limites[c] != null && <span className="font-normal">({pa.limites[c]} min)</span>}</span><span className="grid h-6 min-w-6 place-items-center rounded bg-background/25 px-1.5 font-bold tabular-nums">{t.porCor[c] ?? 0}</span>
        </Button>)}
      </div>
      <div>
        <Button variant="ghost" size="sm" aria-expanded={specialtiesOpen} aria-controls="specialty-distribution" onClick={() => setSpecialtiesOpen((v) => !v)} className="mb-2 h-10 px-0 text-xs"><SlidersHorizontal className="h-3.5 w-3.5" />{specialtiesOpen ? "Ocultar especialidades" : "Mostrar especialidades"}</Button>
        {specialtiesOpen && <div id="specialty-distribution" className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          {pa.especialidades.map((e) => <article key={e.especialidade} className={cn("min-w-0 rounded-md border bg-card p-4 shadow-card", esp === e.especialidade ? "border-primary" : "border-border")}>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3"><Button variant="link" onClick={() => setEsp((v) => v === e.especialidade ? "Todas" : e.especialidade)} aria-pressed={esp === e.especialidade} className="h-auto min-w-0 justify-start whitespace-normal break-words p-0 text-left text-xs font-bold leading-5 text-foreground">{e.especialidade}</Button><span className="text-2xl font-bold tabular-nums">{e.total}</span></div>
            <div className="mt-3 flex h-1.5 overflow-hidden rounded bg-muted">{CORES.map((c) => e.total > 0 && (e.porCor[c] ?? 0) > 0 ? <div key={c} className={corBar[c]} style={{ width: `${((e.porCor[c] ?? 0) / e.total) * 100}%` }} title={`${c}: ${e.porCor[c]}`} /> : null)}</div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">{CORES.filter((c) => (e.porCor[c] ?? 0) > 0).map((c) => <span key={c} className="inline-flex items-center gap-1.5"><span className={cn("h-2 w-2 shrink-0 rounded-full", corBar[c])} />{c} <strong className="font-semibold">{e.porCor[c]}</strong></span>)}</div>
            <p className={cn("mt-3 text-xs font-semibold", e.foraSla > 0 ? "text-critical" : "text-success-strong")}>{e.foraSla > 0 ? `${e.foraSla} fora do SLA` : "Todos dentro do SLA"}</p>
          </article>)}
        </div>}
      </div>
    </section>

    <section aria-labelledby="patients-title" className="min-w-0 space-y-4 border-t border-border pt-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><div className="min-w-0"><h2 id="patients-title" className="text-lg font-bold">Lista de pacientes</h2><p role="status" className="mt-0.5 text-xs text-muted-foreground">{rows.length} de {pa.pacientes.length} pacientes</p></div><Button onClick={exportCsv} variant="outline" className="h-11 shrink-0 px-3" disabled={rows.length === 0} title="Exportar lista filtrada em CSV" aria-label="Exportar CSV"><Download className="h-4 w-4" /><span className="hidden sm:inline">Exportar CSV</span></Button></div>
      <div className="grid min-w-0 grid-cols-2 items-end gap-3 md:grid-cols-3 xl:grid-cols-[minmax(240px,1.5fr)_minmax(150px,1fr)_minmax(100px,.65fr)_minmax(150px,.8fr)]">
        <label className="col-span-2 min-w-0 text-xs font-semibold text-muted-foreground md:col-span-3 xl:col-span-1">Buscar paciente<span className="relative mt-1.5 block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" /><Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Senha, nome ou atendimento" className="h-11 bg-card pl-9 pr-10 [&::-webkit-search-cancel-button]:appearance-none" />{q && <Button variant="ghost" size="icon" onClick={() => setQ("")} aria-label="Limpar busca" title="Limpar busca" className="absolute right-0.5 top-0.5 h-10 w-9"><X className="h-4 w-4" /></Button>}</span></label>
        <label className="col-span-2 min-w-0 text-xs font-semibold text-muted-foreground md:col-span-1">Especialidade<select className="select-field mt-1.5 block h-11 w-full min-w-0 focus-visible:ring-2 focus-visible:ring-ring" value={esp} onChange={(e) => setEsp(e.target.value)}><option>Todas</option>{pa.especialidades.map((e) => <option key={e.especialidade}>{e.especialidade}</option>)}</select></label>
        <label className="min-w-0 text-xs font-semibold text-muted-foreground">Risco<select className="select-field mt-1.5 block h-11 w-full focus-visible:ring-2 focus-visible:ring-ring" value={cor} onChange={(e) => setCor(e.target.value as CorRisco | "Todas")}><option>Todas</option>{CORES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="min-w-0 text-xs font-semibold text-muted-foreground">Situação<select className="select-field mt-1.5 block h-11 w-full focus-visible:ring-2 focus-visible:ring-ring" value={sit} onChange={(e) => setSit(e.target.value as (typeof SITUACOES)[number])}>{SITUACOES.map((s) => <option key={s}>{s}</option>)}</select></label>
      </div>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <label className="inline-flex min-w-0 items-center gap-2 text-xs text-muted-foreground">Ordenar<select aria-label="Ordenar pacientes" value={sort ? `${sort.key}:${sort.dir}` : "default"} onChange={(e) => { if (e.target.value === "default") { setSort(null); return; } const [key, dir] = e.target.value.split(":"); setSort({ key: key as ColKey, dir: Number(dir) as 1 | -1 }); }} className="h-10 min-w-0 max-w-[210px] rounded-md border border-border bg-card px-2 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring"><option value="default">Prioridade e chegada</option>{cols.filter(([key]) => key).map(([key, label]) => <option key={key} value={`${key}:1`}>{label} ↑</option>)}{sort?.dir === -1 && <option value={`${sort.key}:-1`}>{cols.find(([key]) => key === sort.key)?.[1]} ↓</option>}</select></label>
        {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 text-primary"><RotateCcw className="h-3.5 w-3.5" />Limpar filtros</Button>}
      </div>
      {rows.length === 0 ? <div className="flex flex-col items-center gap-3 border-y border-border py-12 text-center"><SearchX className="h-8 w-8 text-muted-foreground" /><p className="text-sm font-semibold">Nenhum paciente para os filtros selecionados.</p>{hasFilters && <Button onClick={clearFilters} variant="outline"><RotateCcw className="h-4 w-4" />Limpar filtros</Button>}</div> : <><PatientTable rows={rows} sort={sort} onSort={toggleSort} /><PatientCards rows={rows} /></>}
    </section>
  </div>;
}
