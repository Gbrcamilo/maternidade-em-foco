import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader, setResponseStatus } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type GestorStatus = "aprovado" | "pendente" | "bloqueado";
export type GestorRow = { id: string; email: string; criadoEm: string; confirmado: boolean; status: GestorStatus; admin: boolean };

async function requireAdmin(userId: string) {
  const { isAdminUser } = await import("./manager-policy.server");
  if (!(await isAdminUser(userId))) {
    setResponseStatus(403);
    throw new Error("Somente o administrador pode aprovar acessos.");
  }
}

/** Situação da conta que está logada: é administrador? está liberada para ver pacientes? */
export const getMeuAcesso = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader("Cache-Control", "private, no-store");
    const { isAdminUser, isAuthorizedManager } = await import("./manager-policy.server");
    const { data } = await context.supabase.auth.getUser();
    const user = data.user && data.user.id === context.userId ? data.user : null;
    return {
      admin: await isAdminUser(context.userId),
      manager: user ? await isAuthorizedManager(user) : false,
      email: user?.email ?? null,
    };
  });

/** Lista as contas e a situação de cada uma. Só o administrador. */
export const listarGestores = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<GestorRow[]> => {
    setResponseHeader("Cache-Control", "private, no-store");
    await requireAdmin(context.userId);
    const { listAccounts, isAdminAccount } = await import("./manager-policy.server");
    const accounts = await listAccounts();
    const rows = await Promise.all(accounts.map(async (u): Promise<GestorRow> => {
      const flag = u.app_metadata?.["gestor"];
      return {
        id: u.id,
        email: u.email ?? "(sem e-mail)",
        criadoEm: u.created_at,
        confirmado: !!u.email_confirmed_at,
        status: flag === true ? "aprovado" : flag === false ? "bloqueado" : "pendente",
        admin: await isAdminAccount(u),
      };
    }));
    return rows.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).slice(0, 200);
  });

/** Aprova ou bloqueia o acesso de uma conta aos dados dos pacientes. Só o administrador. */
export const definirAcesso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid(), aprovar: z.boolean() }).parse(input))
  .handler(async ({ context, data }) => {
    setResponseHeader("Cache-Control", "private, no-store");
    await requireAdmin(context.userId);
    const { isAdminUser } = await import("./manager-policy.server");
    if (await isAdminUser(data.userId)) {
      setResponseStatus(400);
      throw new Error("O acesso do administrador não pode ser alterado.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.aprovar) {
      const { data: alvo, error: lookupError } = await supabaseAdmin.auth.admin.getUserById(data.userId);
      if (lookupError || !alvo.user) {
        setResponseStatus(404);
        throw new Error("Conta não encontrada.");
      }
      if (!alvo.user.email_confirmed_at) {
        setResponseStatus(400);
        throw new Error("O e-mail da conta ainda não foi confirmado.");
      }
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { app_metadata: { gestor: data.aprovar } });
    if (error) {
      console.error("definirAcesso: falha ao atualizar conta");
      throw new Error("Não foi possível atualizar o acesso agora.");
    }
    console.info(`[acesso] admin ${context.userId} ${data.aprovar ? "aprovou" : "bloqueou"} ${data.userId}`);
    return { ok: true as const };
  });
