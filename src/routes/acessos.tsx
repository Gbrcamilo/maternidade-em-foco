import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { AcessoGestor } from "@/components/acesso-gestor";
import { AprovacaoGestores } from "@/components/gestores-admin";
import { getMeuAcesso } from "@/lib/gestores.functions";
import { PageSkeleton } from "@/lib/use-painel";

export const Route = createFileRoute("/acessos")({
  head: () => ({ meta: [
    { title: "Gerenciar acessos — Maternidade em Foco" },
    { name: "description", content: "Aprovação e bloqueio dos gestores com acesso aos dados do PA." },
    { property: "og:title", content: "Gerenciar acessos — Maternidade em Foco" },
    { property: "og:description", content: "Aprovação e bloqueio dos gestores com acesso aos dados do PA." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: AcessosPage,
});

function AcessosPage() {
  const q = useQuery({ queryKey: ["meu-acesso"], queryFn: () => getMeuAcesso(), retry: false });
  if (q.isPending) return <PageSkeleton />;
  if (q.isError || !q.data) return <AcessoGestor />;
  if (!q.data.admin) {
    return (
      <div className="mx-auto max-w-lg space-y-3 rounded-2xl border-2 border-l-8 border-critical bg-card p-6 shadow-card">
        <h1 className="flex items-center gap-2 text-xl font-bold"><ShieldAlert className="h-6 w-6 text-critical-strong" />Acesso restrito</h1>
        <p className="text-sm text-muted-foreground">Somente o administrador pode gerenciar os acessos dos gestores.</p>
        <Link to="/pa" className="text-sm font-medium text-primary underline-offset-4 hover:underline">Voltar para Pacientes do PA</Link>
      </div>
    );
  }
  return (
    <>
      <PageHeader title="Gerenciar acessos" subtitle="Autorize ou bloqueie os gestores que podem ver os dados dos pacientes" />
      <AprovacaoGestores />
    </>
  );
}
