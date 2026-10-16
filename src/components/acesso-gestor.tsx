import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, Copy, KeyRound, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Who = { id: string; email: string | null } | null;

/** Sessão do gestor (Supabase Auth). `undefined` enquanto carrega. */
function useWho(): Who | undefined {
  const [who, setWho] = useState<Who | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    let unsubscribe: (() => void) | undefined;
    void import("@/integrations/supabase/client").then(({ supabase }) => {
      if (!alive) return;
      const toWho = (session: { user: { id: string; email?: string | undefined } } | null): Who => (session ? { id: session.user.id, email: session.user.email ?? null } : null);
      void supabase.auth.getSession().then(({ data }) => { if (alive) setWho(toWho(data.session)); });
      const { data } = supabase.auth.onAuthStateChange((_event, session) => { if (alive) setWho(toWho(session)); });
      unsubscribe = () => data.subscription.unsubscribe();
    });
    return () => { alive = false; unsubscribe?.(); };
  }, []);
  return who;
}

async function signOut(clear: () => void) {
  const { supabase } = await import("@/integrations/supabase/client");
  await supabase.auth.signOut();
  clear();
}

/** Botão "Sair" da área dos gestores; só aparece com sessão aberta. */
export function SairButton({ className }: { className?: string }) {
  const who = useWho();
  const qc = useQueryClient();
  if (!who) return null;
  return <Button type="button" variant="outline" size="sm" className={className} onClick={() => void signOut(() => qc.removeQueries({ queryKey: ["pa"] }))}><LogOut className="mr-1.5 h-4 w-4" />Sair</Button>;
}

/** Tela mostrada em /pa quando não há acesso: entrar, criar conta ou pedir liberação. */
export function AcessoGestor() {
  const who = useWho();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "erro" | "ok"; texto: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (senha.length < 8) { setMsg({ tipo: "erro", texto: "A senha precisa ter pelo menos 8 caracteres." }); return; }
    setBusy(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      if (mode === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
        if (error) { setMsg({ tipo: "erro", texto: "E-mail ou senha incorretos." }); return; }
        await qc.invalidateQueries({ queryKey: ["pa"] });
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: senha });
        if (error) { setMsg({ tipo: "erro", texto: "Não foi possível criar a conta. Confira os dados e tente novamente." }); return; }
        if (!data.session) setMsg({ tipo: "ok", texto: "Conta criada. Enviamos um e-mail de confirmação: confirme e depois entre." });
        else await qc.invalidateQueries({ queryKey: ["pa"] });
      }
    } catch {
      setMsg({ tipo: "erro", texto: "Não foi possível concluir agora. Tente novamente." });
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { window.prompt("Copie o código abaixo:", text); }
  };

  if (who === undefined) return <p role="status" className="py-8 text-sm text-muted-foreground">Verificando acesso…</p>;

  if (who) {
    return (
      <section className="mx-auto max-w-xl space-y-4 py-8">
        <div className="flex items-start gap-3 rounded-2xl border-2 border-l-8 border-warning bg-card p-5 shadow-card">
          <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-warning-strong" />
          <div className="min-w-0 space-y-2">
            <h1 className="text-xl font-bold">Esta conta ainda não tem permissão</h1>
            <p className="text-sm leading-6 text-muted-foreground">Você entrou como <strong className="text-foreground">{who.email ?? "gestor"}</strong>, mas os dados dos pacientes só são liberados para gestores autorizados.</p>
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border-2 border-border bg-card p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-base font-bold"><KeyRound className="h-5 w-5 text-primary" />Código de acesso desta conta</h2>
          <p className="text-sm leading-6 text-muted-foreground">Envie este código ao responsável pelo sistema. Ele precisa incluí-lo na configuração <code className="rounded bg-muted px-1 py-0.5 text-xs">PA_MANAGER_USER_IDS</code> do aplicativo. Depois é só atualizar esta página.</p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded-md bg-muted px-3 py-2 text-xs sm:text-sm">{who.id}</code>
            <Button type="button" variant="outline" size="sm" onClick={() => void copy(who.id)}>{copied ? <Check className="mr-1.5 h-4 w-4 text-success" /> : <Copy className="mr-1.5 h-4 w-4" />}{copied ? "Copiado" : "Copiar"}</Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" onClick={() => void qc.invalidateQueries({ queryKey: ["pa"] })}>Já foi liberado? Atualizar</Button>
            <SairButton />
            <Button asChild variant="ghost"><Link to="/painel-pacientes">Abrir painel para pacientes</Link></Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-md space-y-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Acesso dos gestores</h1>
        <p className="text-sm leading-6 text-muted-foreground">Área restrita com os dados individuais do pronto atendimento. Entre com a sua conta.</p>
      </div>
      <form onSubmit={(e) => void submit(e)} className="space-y-4 rounded-2xl border-2 border-border bg-card p-5 shadow-card">
        <div className="space-y-1.5">
          <label htmlFor="gestor-email" className="text-sm font-semibold">E-mail</label>
          <Input id="gestor-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="gestor-senha" className="text-sm font-semibold">Senha</label>
          <Input id="gestor-senha" type="password" autoComplete={mode === "entrar" ? "current-password" : "new-password"} required minLength={8} value={senha} onChange={(e) => setSenha(e.target.value)} />
        </div>
        {msg && <p role={msg.tipo === "erro" ? "alert" : "status"} className={msg.tipo === "erro" ? "text-sm font-semibold text-critical-strong" : "text-sm font-semibold text-success-strong"}>{msg.texto}</p>}
        <Button type="submit" className="h-11 w-full" disabled={busy}>{busy ? "Aguarde…" : mode === "entrar" ? "Entrar" : "Criar conta"}</Button>
        <button type="button" onClick={() => { setMode(mode === "entrar" ? "criar" : "entrar"); setMsg(null); }} className="w-full text-center text-sm font-medium text-primary underline-offset-4 hover:underline">{mode === "entrar" ? "Primeiro acesso? Criar conta" : "Já tenho conta. Entrar"}</button>
      </form>
      <p className="text-center text-xs text-muted-foreground">Ter uma conta não libera os dados dos pacientes: o acesso é concedido só a gestores autorizados.</p>
      <div className="text-center"><Link to="/painel-pacientes" className="text-sm font-medium text-primary underline-offset-4 hover:underline">Voltar ao painel para pacientes</Link></div>
    </section>
  );
}
