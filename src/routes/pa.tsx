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

