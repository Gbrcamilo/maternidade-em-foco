import { createMiddleware } from "@tanstack/react-start";
import { setResponseHeader, setResponseStatus } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Deny by default: signing up alone must never grant access to patient records. Access requires approval by the administrator. */
export const requireManager = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ context, next }) => {
    setResponseHeader("Cache-Control", "private, no-store");
    const { data, error } = await context.supabase.auth.getUser();
    let allowed = false;
    if (!error && data.user && data.user.id === context.userId) {
      const { isAuthorizedManager } = await import("./manager-policy.server");
      allowed = await isAuthorizedManager(data.user);
    }
    if (!allowed) {
      setResponseStatus(403);
      throw new Error("Acesso restrito aos gestores autorizados.");
    }
    return next();
  });
