import { createMiddleware } from "@tanstack/react-start";
import { setResponseHeader, setResponseStatus } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Deny by default: signing up alone must never grant access to patient records. */
export const requireManager = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ context, next }) => {
    setResponseHeader("Cache-Control", "private, no-store");
    const allowed = (process.env["PA_MANAGER_USER_IDS"] ?? "").split(",").map((id) => id.trim()).filter(Boolean);
    const { data, error } = await context.supabase.auth.getUser();
    if (error || !data.user || data.user.id !== context.userId || !allowed.includes(context.userId)) {
      setResponseStatus(403);
      throw new Error("Acesso restrito aos gestores autorizados.");
    }
    return next();
  });