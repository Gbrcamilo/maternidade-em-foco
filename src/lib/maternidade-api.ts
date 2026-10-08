import { createServerFn } from "@tanstack/react-start";
import type { Painel, SalaResponse } from "./mock-data";

async function callApi<T>(path: string): Promise<T> {
  const base = process.env.MATERNIDADE_API_URL;
  const key = process.env.MATERNIDADE_API_KEY;
  if (!base || !key) throw new Error("Fonte de dados não configurada");
  const res = await fetch(`${base.replace(/\/$/, "")}${path}`, { headers: { "x-api-key": key, accept: "application/json" } });
  if (!res.ok) {
    console.error(`maternidade-api ${path} respondeu ${res.status}`);
    throw new Error("Fonte de dados indisponível");
  }
  return (await res.json()) as T;
}

export const getPainel = createServerFn({ method: "GET" }).handler(async () => callApi<Painel>("/api/v1/painel"));

export const getSala = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => {
    if (!/^[\w-]{1,20}$/.test(input.id)) throw new Error("Sala inválida");
    return input;
  })
  .handler(async ({ data }) => callApi<SalaResponse>(`/api/v1/salas/${encodeURIComponent(data.id)}`));
