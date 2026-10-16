import { createClient } from "@supabase/supabase-js";

export async function isManagerRequest(request: Request): Promise<boolean> {
  const allowed = (process.env["PA_MANAGER_USER_IDS"] ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!allowed.length || !token || !url || !key) return false;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  const { data, error } = await client.auth.getUser(token);
  return !error && !!data.user && allowed.includes(data.user.id);
}