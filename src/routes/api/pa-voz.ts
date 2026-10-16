import { createFileRoute } from "@tanstack/react-router";

// Aviso de voz do PA: recebe apenas o número de pacientes fora do SLA,
// monta a frase no servidor e devolve o áudio em fluxo. Sem texto livre.
export const Route = createFileRoute("/api/pa-voz")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { isManagerRequest } = await import("@/lib/manager-request.server");
        if (!await isManagerRequest(request)) {
          return Response.json({ erro: "Acesso restrito aos gestores autorizados." }, { status: 403, headers: { "Cache-Control": "no-store" } });
        }
        const origin = request.headers.get("origin");
        if (origin && origin !== new URL(request.url).origin) {
          return Response.json({ erro: "Solicitação não autorizada." }, { status: 403 });
        }
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return Response.json({ erro: "A conexão com Lovable AI precisa ser configurada." }, { status: 401 });
        }
        let foraSla = 0;
        try {
          const body = await request.json();
          foraSla = Number(body?.foraSla);
        } catch {
          return Response.json({ erro: "Pedido inválido." }, { status: 400 });
        }
        if (!Number.isInteger(foraSla) || foraSla <= 0 || foraSla > 1000000) {
          return Response.json({ erro: "Nada a anunciar." }, { status: 400 });
        }
        const { buildAnnouncement, requestSpeech } = await import("@/lib/speech.server");
        const upstream = await requestSpeech(buildAnnouncement(foraSla), apiKey);
        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("Content-Type") ?? "text/event-stream",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
