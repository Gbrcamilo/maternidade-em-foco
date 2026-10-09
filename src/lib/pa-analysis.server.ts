import { APICallError, NoObjectGeneratedError } from "ai";
import { createResponsesCall } from "./ai/responses.server";
import { operationalSummarySchema, type PaAggregates, type AnalysisResult } from "./pa-analysis-schema";

type Block = { message: string; status: number };
let blocked: Block | undefined;
let lastCall = 0;
let busy = false;

// Worker Cache persists terminal access blocks beyond a process restart.
async function blockCache(request: Request) {
  if (!("caches" in globalThis)) return undefined;
  return { cache: await caches.open("pa-ai-access-v1"), key: new Request(`${new URL(request.url).origin}/__pa-ai-access-block`) };
}
function safeGatewayError(error: unknown): Block {
  if (!APICallError.isInstance(error)) return { status: 500, message: "Não foi possível concluir a análise. Os dados informados foram preservados." };
  let message = "";
  try {
    const body = JSON.parse(error.responseBody ?? "{}");
    message = typeof body.message === "string" ? body.message : typeof body.error?.message === "string" ? body.error.message : "";
  } catch { /* Never expose raw bodies or credentials. */ }
  const status = error.statusCode ?? 500;
  return { status, message: message || (status === 429 ? "Muitas solicitações. Aguarde antes de gerar outra análise." : status === 401 ? "A conexão com Lovable AI precisa ser configurada." : status === 402 ? "Créditos de Lovable AI insuficientes. Verifique Planos e créditos." : status === 403 ? "Acesso à Lovable AI não autorizado. A configuração precisa ser revisada." : status === 404 ? "O modelo de análise está indisponível." : "Não foi possível concluir a análise. Os dados informados foram preservados.") };
}
export async function generateOperationalSummary(data: PaAggregates, apiKey: string | undefined, request: Request): Promise<AnalysisResult> {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return { ok: false, status: 403, message: "Solicitação não autorizada." };
  if (!apiKey) return { ok: false, status: 401, message: "A conexão com Lovable AI precisa ser configurada." };
  const storage = await blockCache(request);
  const stored = await storage?.cache.match(storage.key);
  if (stored) blocked = await stored.json() as Block;
  if (blocked) return { ok: false, ...blocked };
  if (busy || Date.now() - lastCall < 60000) return { ok: false, status: 429, message: "Aguarde um minuto entre análises operacionais." };
  busy = true;
  lastCall = Date.now();
  try {
    const { result } = createResponsesCall(request, { baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, model: "openai/gpt-6-astra" },
      [{ role: "user", content: JSON.stringify(data) }],
      "Você auxilia a coordenação operacional de um pronto atendimento obstétrico. Responda em português brasileiro, exclusivamente com os dados agregados fornecidos. Não há informações individuais. Nunca solicite ou invente nomes ou identificadores. Gere um resumo de até 100 palavras, no máximo 3 gargalos com evidência numérica e uma ação operacional sugerida por gargalo, até 3 prioridades e limitações dos dados. As cores descrevem apenas a fila aguardando médico; foraSla também se refere EXCLUSIVAMENTE à fila aguardando médico, cujo denominador é aguardandoMedico. finalizados se refere ao período informado. Não assuma limites Manchester não fornecidos, não conclua tendências a partir de uma única observação, não invente especialidades ou taxas de chegada. Não faça diagnóstico, prescrição ou decisões de prioridade clínica. Ações são sugestões para validação da coordenação. Caso não haja fila, informe explicitamente a ausência de gargalos observáveis. Se faltam denominadores ou capacidade, declare a limitação.", operationalSummarySchema);
    const summary = await result.output;
    if (!summary) return { ok: false, status: 422, message: "A IA não forneceu um resumo válido. Nenhuma análise foi gerada." };
    return { ok: true, resumo: summary, geradoEm: new Date().toISOString() };
  } catch (error) {
    // Refusals and malformed/empty outputs are terminal; no automatic resend.
    if (NoObjectGeneratedError.isInstance(error)) return { ok: false, status: 422, message: "A IA não forneceu um resumo válido ou recusou a solicitação." };
    const failure = safeGatewayError(error);
    if ([402, 403].includes(failure.status)) {
      blocked = failure;
      if (storage) await storage.cache.put(storage.key, new Response(JSON.stringify(failure), { headers: { "Content-Type": "application/json", "Cache-Control": "max-age=31536000" } }));
    }
    return { ok: false, ...failure };
  } finally { busy = false; }
}