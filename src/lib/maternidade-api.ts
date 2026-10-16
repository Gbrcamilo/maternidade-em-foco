import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { requireManager } from "./manager-access";
import { projectPaSummary, type PaPublicResult } from "./pa-public-summary";
import type { Pa, PaResult, Painel, SalaResponse } from "./mock-data";

const UNIDADE = "cmi-bloco-obstetrico";
type Snapshot = { painel?: Painel; pa?: Pa; salas?: Record<string, SalaResponse> };

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

export const getPa = createServerFn({ method: "GET" }).middleware([requireManager]).handler(async (): Promise<PaResult> => {
  const snap = await lerSnapshot();
  if (!snap) throw new Error("Fonte de dados indisponível");
  if (!snap.payload.pa) return { aguardando: true, atualizadoEm: snap.atualizadoEm };
  return { aguardando: false, pa: snap.payload.pa, atualizadoEm: snap.atualizadoEm };
});

// Painel público para pacientes: só números agregados (allowlist), nunca registros individuais.
export const getPaPublico = createServerFn({ method: "GET" }).handler(async (): Promise<PaPublicResult> => {
  setResponseHeader("Cache-Control", "no-store");
  try {
    const snap = await lerSnapshot();
    if (!snap) throw new Error("x");
    if (!snap.payload.pa) return { aguardando: true, atualizadoEm: snap.atualizadoEm };
    return { aguardando: false, pa: projectPaSummary(snap.payload.pa), atualizadoEm: snap.atualizadoEm };
  } catch {
    throw new Error("Fonte de dados indisponível");
  }
});
