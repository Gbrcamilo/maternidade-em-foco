import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { projectPaSummary, type PaPublicResult } from "./pa-public-summary";

const UNIDADE = "cmi-bloco-obstetrico";
type Snapshot = { pa?: unknown };

// Executado apenas dentro dos handlers (servidor). A chave de serviço nunca vai ao navegador.
async function lerSnapshot(): Promise<{ payload: Snapshot; atualizadoEm: string } | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("painel_snapshot")
    .select("payload, atualizado_em")
    .eq("unidade", UNIDADE)
    .maybeSingle();
  if (error) {
    console.error("painel_snapshot: falha de leitura", error.code);
    return null;
  }
  if (!data) return null;
  return { payload: (data.payload ?? {}) as Snapshot, atualizadoEm: data.atualizado_em };
}

export const getPa = createServerFn({ method: "GET" }).handler(async (): Promise<PaPublicResult> => {
  setResponseHeader("Cache-Control", "no-store");
  try {
    const snap = await lerSnapshot();
    if (!snap) throw new Error("Fonte de dados indisponível");
    if (!snap.payload.pa) return { aguardando: true, atualizadoEm: snap.atualizadoEm };
    return { aguardando: false, pa: projectPaSummary(snap.payload.pa), atualizadoEm: snap.atualizadoEm };
  } catch {
    throw new Error("Fonte de dados indisponível");
  }
});
