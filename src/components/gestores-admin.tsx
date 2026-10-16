import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock3, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { definirAcesso, listarGestores, type GestorRow, type GestorStatus } from "@/lib/gestores.functions";
import { cn } from "@/lib/utils";

const when = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const CHIP: Record<GestorStatus, string> = {
  aprovado: "bg-surface-risk-green text-success-strong",
  pendente: "bg-surface-risk-orange text-warning-strong",
  bloqueado: "bg-surface-risk-red text-critical-strong",
};
const LABEL: Record<GestorStatus, string> = { aprovado: "Aprovado", pendente: "Aguardando aprovação", bloqueado: "Bloqueado" };

/** Tela do administrador: aprova ou bloqueia quem pediu acesso aos dados dos pacientes. */
export function AprovacaoGestores() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["gestores"], queryFn: () => listarGestores(), retry: false, refetchInterval: 20_000 });
  const m = useMutation({
    mutationFn: (v: { userId: string; aprovar: boolean }) => definirAcesso({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gestores"] }),
  });

  const rows: GestorRow[] = q.data ?? [];
  const pending = rows.filter((r) => r.status === "pendente" && !r.admin);
  const ordered = [...rows].sort((a, b) => Number(b.status === "pendente") - Number(a.status === "pendente") || b.criadoEm.localeCompare(a.criadoEm));

  return (
    <section aria-labelledby="aprov-title" className="mb-6 space-y-3 rounded-2xl border-2 border-l-8 border-primary bg-card p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="aprov-title" className="flex items-center gap-2 text-lg font-bold"><ShieldCheck className="h-5 w-5 text-primary" />Aprovar acessos de gestores</h2>
        <span className={cn("rounded-full px-3 py-1 text-xs font-bold", pending.length > 0 ? "bg-surface-risk-orange text-warning-strong" : "bg-muted text-muted-foreground")}>{pending.length > 0 ? `${pending.length} aguardando` : "Nenhuma solicitação"}</span>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">Quem criar conta pelo link do gestor aparece aqui. Só entra nos dados dos pacientes depois da sua aprovação. Você pode bloquear a qualquer momento.</p>
      {q.isPending && <p role="status" className="text-sm text-muted-foreground">Carregando…</p>}
      {q.isError && <p role="alert" className="text-sm font-semibold text-critical-strong">Não foi possível carregar a lista agora.</p>}
      {m.isError && <p role="alert" className="text-sm font-semibold text-critical-strong">Não foi possível salvar. Tente novamente.</p>}
      {ordered.length > 0 && <ul className="divide-y divide-border rounded-xl border border-border">
        {ordered.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
            <div className="min-w-0">
              <p className="break-all text-sm font-semibold">{r.email}{r.admin && <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary">Administrador</span>}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />Cadastro em {when(r.criadoEm)}{!r.confirmado && <span className="font-semibold text-warning-strong">· e-mail ainda não confirmado</span>}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", r.admin ? "bg-surface-risk-green text-success-strong" : CHIP[r.status])}>{r.admin || r.status === "aprovado" ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}{r.admin ? "Acesso total" : LABEL[r.status]}</span>
              {!r.admin && r.status !== "aprovado" && <Button type="button" size="sm" disabled={m.isPending || !r.confirmado} title={r.confirmado ? undefined : "O e-mail precisa estar confirmado"} onClick={() => m.mutate({ userId: r.id, aprovar: true })}><UserCheck className="mr-1.5 h-4 w-4" />Aprovar</Button>}
              {!r.admin && r.status !== "bloqueado" && <Button type="button" size="sm" variant="outline" disabled={m.isPending} onClick={() => m.mutate({ userId: r.id, aprovar: false })}><UserX className="mr-1.5 h-4 w-4" />{r.status === "aprovado" ? "Bloquear" : "Recusar"}</Button>}
            </div>
          </li>
        ))}
      </ul>}
    </section>
  );
}
