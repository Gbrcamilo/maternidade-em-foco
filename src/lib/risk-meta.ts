import { AlertTriangle, Hourglass, Info, Leaf, Siren } from "lucide-react";
import type { ComponentType } from "react";
import type { CorRisco } from "@/lib/mock-data";

export type RiskMeta = { nome: string; texto: string; icon: ComponentType<{ className?: string }>; border: string; tone: string; bar: string; surface: string };

/** Nomes e descrições da classificação por urgência, em linguagem simples. */
export const RISKS: Record<CorRisco, RiskMeta> = {
  Vermelho: { nome: "Emergência", texto: "Atendimento imediato", icon: Siren, border: "border-critical", tone: "text-critical-strong", bar: "bg-critical", surface: "bg-surface-risk-red" },
  Laranja: { nome: "Muito urgente", texto: "Atendimento prioritário", icon: AlertTriangle, border: "border-warning", tone: "text-warning-strong", bar: "bg-warning", surface: "bg-surface-risk-orange" },
  Amarelo: { nome: "Urgente", texto: "Atendimento com prioridade", icon: Hourglass, border: "border-caution", tone: "text-caution-strong", bar: "bg-caution", surface: "bg-surface-risk-yellow" },
  Verde: { nome: "Pouco urgente", texto: "Atendimento por ordem de chegada", icon: Leaf, border: "border-success", tone: "text-success-strong", bar: "bg-success", surface: "bg-surface-risk-green" },
  Azul: { nome: "Não urgente", texto: "Pode aguardar com segurança", icon: Info, border: "border-cleaning", tone: "text-cleaning-strong", bar: "bg-cleaning", surface: "bg-surface-risk-blue" },
  Branco: { nome: "Orientação", texto: "Atendimento simples", icon: Info, border: "border-border", tone: "text-foreground", bar: "bg-border", surface: "bg-surface-risk-white" },
  "Sem cor": { nome: "Ainda sem classificação", texto: "Aguardando avaliação da equipe", icon: Info, border: "border-muted-foreground", tone: "text-foreground", bar: "bg-muted-foreground", surface: "bg-surface-risk-grey" },
};
export const MAIN_RISKS: CorRisco[] = ["Vermelho", "Laranja", "Amarelo", "Verde", "Azul"];
