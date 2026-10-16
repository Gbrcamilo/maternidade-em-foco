import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ids = (name: string) => (process.env[name] ?? "").split(",").map((id) => id.trim()).filter(Boolean);

/** Todas as contas do Supabase Auth (até 10 mil), só no servidor. */
export async function listAccounts(): Promise<User[]> {
  const out: User[] = [];
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error("accounts_unavailable");
    out.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return out;
}

/**
 * Administrador = conta mais antiga com e-mail confirmado, ou os códigos de `PA_ADMIN_USER_IDS` se definidos.
 * Quem cadastra depois nunca é mais antigo, então ninguém "toma" o posto.
 */
export function pickAdminId(accounts: User[]): string | null {
  const oldest = [...accounts].sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
  return oldest && oldest.email_confirmed_at ? oldest.id : null;
}

let adminCache: { id: string | null; at: number } | null = null;
const ADMIN_CACHE_MS = 60_000;

export async function isAdminUser(userId: string): Promise<boolean> {
  const fromEnv = ids("PA_ADMIN_USER_IDS");
  if (fromEnv.length) return fromEnv.includes(userId);
  if (!adminCache || Date.now() - adminCache.at > ADMIN_CACHE_MS) adminCache = { id: pickAdminId(await listAccounts()), at: Date.now() };
  return adminCache.id === userId;
}

/** Gestor autorizado: aprovado pelo administrador (app_metadata.gestor), administrador, ou listado em `PA_MANAGER_USER_IDS`. */
export async function isAuthorizedManager(user: { id: string; app_metadata?: Record<string, unknown> | null }): Promise<boolean> {
  if (ids("PA_MANAGER_USER_IDS").includes(user.id)) return true;
  if (user.app_metadata?.["gestor"] === true) return true;
  return isAdminUser(user.id);
}
