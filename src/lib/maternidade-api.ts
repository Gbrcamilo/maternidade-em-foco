import { createServerFn } from "@tanstack/react-start";
import type { Painel, PainelResult, SalaResponse, SalaResult } from "./mock-data";

const UNIDADE = "cmi-bloco-obstetrico";
type Snapshot = { painel?: Painel; salas?: Record<string, SalaResponse> };

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

export const getPainel = createServerFn({ method: "GET" }).handler(async (): Promise<PainelResult> => {
  const snap = await lerSnapshot();
  if (!snap?.payload.painel) throw new Error("Fonte de dados indisponível");
  return { ...snap.payload.painel, atualizadoEm: snap.atualizadoEm };
});

export const getSala = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => {
    if (!/^[\w-]{1,20}$/.test(input.id)) throw new Error("Sala inválida");
    return input;
  })
  .handler(async ({ data }): Promise<SalaResult> => {
    const snap = await lerSnapshot();
    if (!snap) throw new Error("Fonte de dados indisponível");
    const sala = snap.payload.salas?.[data.id];
    if (!sala) return { naoEncontrada: true };
    return { ...sala, atualizadoEm: snap.atualizadoEm };
  });
