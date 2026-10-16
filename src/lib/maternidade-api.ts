import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader, setResponseStatus } from "@tanstack/react-start/server";
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
// Acesso aberto (sem login). Para proteger o banco contra excesso de chamadas: cache curto
// compartilhado entre visitantes e limite de requisições por IP.
const CACHE_MS = 5_000;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 300;
let publicCache: { at: number; value: PaPublicResult } | null = null;
let publicInflight: Promise<PaPublicResult> | null = null;
const hits = new Map<string, { n: number; reset: number }>();

function rateLimited(): boolean {
  const h = getRequest()?.headers;
  const ip = h?.get("cf-connecting-ip") ?? h?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  const cur = hits.get(ip);
  if (!cur || cur.reset < now) { hits.set(ip, { n: 1, reset: now + RATE_WINDOW_MS }); return false; }
  cur.n += 1;
  return cur.n > RATE_MAX;
}

async function carregarPublico(): Promise<PaPublicResult> {
  const snap = await lerSnapshot();
  if (!snap) throw new Error("x");
  if (!snap.payload.pa) return { aguardando: true, atualizadoEm: snap.atualizadoEm };
  return { aguardando: false, pa: projectPaSummary(snap.payload.pa), atualizadoEm: snap.atualizadoEm };
}

export const getPaPublico = createServerFn({ method: "GET" }).handler(async (): Promise<PaPublicResult> => {
  setResponseHeader("Cache-Control", "no-store");
  if (rateLimited()) {
    setResponseStatus(429);
    setResponseHeader("Retry-After", "60");
    throw new Error("Muitas solicitações. Tente novamente em instantes.");
  }
  try {
    if (publicCache && Date.now() - publicCache.at < CACHE_MS) return publicCache.value;
    publicInflight ??= carregarPublico().finally(() => { publicInflight = null; });
    const value = await publicInflight;
    publicCache = { at: Date.now(), value };
    return value;
  } catch {
    throw new Error("Fonte de dados indisponível");
  }
});
