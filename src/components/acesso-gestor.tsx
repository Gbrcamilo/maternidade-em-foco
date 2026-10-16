import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Hourglass, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PartnerLogos, CREDIT_TI } from "@/components/partner-logos";

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
  return <Button type="button" variant="outline" size="sm" className={className} onClick={() => void signOut(() => { qc.removeQueries({ queryKey: ["pa"] }); qc.removeQueries({ queryKey: ["meu-acesso"] }); qc.removeQueries({ queryKey: ["gestores"] }); })}><LogOut className="mr-1.5 h-4 w-4" />Sair</Button>;
}

/** Moldura igual à do painel público (faixa de logos e rodapé), cobrindo o menu lateral. */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-auto bg-background text-foreground">
      <header className="border-b border-border bg-white shadow-sm"><div className="mx-auto w-full max-w-[1920px] px-4 py-3 md:px-6 xl:px-8"><PartnerLogos /></div></header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center space-y-4 px-4 py-8">{children}</main>
      <footer className="border-t border-border px-6 py-3 text-center text-xs text-muted-foreground">{CREDIT_TI}</footer>
    </div>
  );
}

/** Entrar / criar conta / aguardar aprovação, em uma tela simples. */
export function AcessoGestor() {
  const who = useWho();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "erro" | "ok"; texto: string } | null>(null);

  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["pa"] }), qc.invalidateQueries({ queryKey: ["meu-acesso"] })]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (senha.length < 8) { setMsg({ tipo: "erro", texto: "A senha precisa ter pelo menos 8 caracteres." }); return; }
    setBusy(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      if (mode === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
        if (error) { setMsg({ tipo: "erro", texto: /confirm/i.test(error.message) ? "Confirme seu e-mail pelo link que enviamos e tente de novo." : "E-mail ou senha incorretos." }); return; }
        await refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: senha });
        if (error) { setMsg({ tipo: "erro", texto: "Não foi possível criar a conta. Confira os dados e tente novamente." }); return; }
        if (!data.session) { setMsg({ tipo: "ok", texto: "Conta criada. Enviamos um e-mail de confirmação: abra o link e depois entre aqui." }); setMode("entrar"); }
        else await refresh();
      }
    } catch {
      setMsg({ tipo: "erro", texto: "Não foi possível concluir agora. Tente novamente." });
    } finally {
      setBusy(false);
    }
  };

  if (who === undefined) return <Frame><p role="status" className="text-center text-sm text-muted-foreground">Verificando acesso…</p></Frame>;

  if (who) {
    return (
      <Frame>
        <div className="space-y-3 rounded-2xl border-2 border-l-8 border-warning bg-card p-5 shadow-card">
          <h1 className="flex items-center gap-2 text-xl font-bold"><Hourglass className="h-6 w-6 text-warning-strong" />Aguardando aprovação</h1>
          <p className="text-sm leading-6 text-muted-foreground">Seu cadastro (<strong className="text-foreground">{who.email ?? "gestor"}</strong>) foi recebido. Assim que o administrador aprovar, você poderá ver os dados dos pacientes. Avise-o que você pediu acesso.</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" onClick={() => void refresh()}>Já fui aprovado? Atualizar</Button>
            <SairButton />
          </div>
        </div>
        <div className="text-center"><Link to="/painel-pacientes" className="text-sm font-medium text-primary underline-offset-4 hover:underline">Ver o painel para pacientes</Link></div>
      </Frame>
    );
  }

  return (
    <Frame>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Acesso dos gestores</h1>
        <p className="text-sm leading-6 text-muted-foreground">Dados individuais do pronto atendimento. Entre com seu e-mail e senha.</p>
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
        <Button type="submit" className="h-11 w-full" disabled={busy}>{busy ? "Aguarde…" : mode === "entrar" ? "Entrar" : "Pedir acesso"}</Button>
        <button type="button" onClick={() => { setMode(mode === "entrar" ? "criar" : "entrar"); setMsg(null); }} className="w-full text-center text-sm font-medium text-primary underline-offset-4 hover:underline">{mode === "entrar" ? "Primeiro acesso? Pedir acesso" : "Já tenho conta. Entrar"}</button>
      </form>
      <p className="text-center text-xs text-muted-foreground">O acesso é liberado pelo administrador depois do seu pedido.</p>
      <div className="text-center"><Link to="/painel-pacientes" className="text-sm font-medium text-primary underline-offset-4 hover:underline">Voltar ao painel para pacientes</Link></div>
    </Frame>
  );
}
