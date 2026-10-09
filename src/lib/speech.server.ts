// Somente servidor: gera o aviso de voz do PA via Lovable AI Gateway.
// A chave nunca sai do servidor; o navegador recebe apenas o áudio.

const SPEECH = {
  baseURL: "https://ai.gateway.lovable.dev",
  model: "google/gemini-3.1-flash-tts-preview",
  voice: "Kore",
} as const;

export function buildAnnouncement(foraSla: number): string {
  const n = Math.max(0, Math.min(999, Math.floor(foraSla)));
  const pacientes = n === 1 ? "paciente" : "pacientes";
  return `Atenção. ${n} ${pacientes} fora do SLA de tempo de espera.`;
}

export function requestSpeech(text: string, apiKey: string) {
  return fetch(`${SPEECH.baseURL}/v1/audio/speech`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: SPEECH.model,
      contents: [{ role: "user", parts: [{ text: `Diga em português brasileiro, com voz clara e firme de aviso hospitalar: ${text}` }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: SPEECH.voice } } },
      },
      stream_format: "sse",
    }),
  });
}
