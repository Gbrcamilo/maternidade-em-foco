import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ids = (name: string) => (process.env[name] ?? "").split(",").map((id) => id.trim()).filter(Boolean);
const emails = (name: string) => ids(name).map((e) => e.toLowerCase());

/** Impressão digital (SHA-256) do e-mail do administrador: o e-mail em si não fica no repositório público. */
const ADMIN_EMAIL_SHA256 = "c5e943f2661debefa323dfe931c6ba60116f4cabc2be2a8048bfdb879e4ab3b4";

async function sha256Hex(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

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
 * Administrador = conta com o e-mail do administrador **e e-mail confirmado**
 * (ou os códigos/e-mails de `PA_ADMIN_USER_IDS` / `PA_ADMIN_EMAILS`, se definidos).
 * A confirmação impede que outra pessoa se passe pelo administrador.
 */
export async function isAdminAccount(user: { id: string; email?: string | null | undefined; email_confirmed_at?: string | null | undefined }): Promise<boolean> {
  if (!user.email_confirmed_at) return false;
  if (ids("PA_ADMIN_USER_IDS").includes(user.id)) return true;
  const mail = (user.email ?? "").trim().toLowerCase();
  if (!mail) return false;
  if (emails("PA_ADMIN_EMAILS").includes(mail)) return true;
  return (await sha256Hex(mail)) === ADMIN_EMAIL_SHA256;
}

const adminCache = new Map<string, { ok: boolean; at: number }>();
const ADMIN_CACHE_MS = 60_000;

export async function isAdminUser(userId: string): Promise<boolean> {
  const hit = adminCache.get(userId);
  if (hit && Date.now() - hit.at < ADMIN_CACHE_MS) return hit.ok;
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  const ok = !error && !!data.user && (await isAdminAccount(data.user));
  if (adminCache.size > 500) adminCache.clear();
  adminCache.set(userId, { ok, at: Date.now() });
  return ok;
}

/** Gestor autorizado: aprovado pelo administrador (app_metadata.gestor), administrador, ou listado em `PA_MANAGER_USER_IDS`. */
export async function isAuthorizedManager(user: { id: string; app_metadata?: Record<string, unknown> | null }): Promise<boolean> {
  if (ids("PA_MANAGER_USER_IDS").includes(user.id)) return true;
  if (user.app_metadata?.["gestor"] === true) return true;
  return isAdminUser(user.id);
}
