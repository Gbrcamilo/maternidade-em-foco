import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { playPaAnnouncement } from "./stream-speech";
import { cn } from "./utils";

/** Intervalo de lembrete ao gestor enquanto houver pacientes fora do SLA. */
export const LEMBRETE_MS = 5 * 60 * 1000;

function bip() {
  try {
    const ctx = new AudioContext();
    [0, 0.35].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.25, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.3);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch { /* sem som disponível */ }
}

/**
 * Alertas do gestor: voz, notificação do sistema, aviso na tela e título da aba
 * piscando. Dispara quando o número fora do SLA muda e repete a cada 5 min.
 */
export function useAlertasGestor(foraSla: number | undefined) {
  const [voz, setVoz] = useState(false);
  const [notif, setNotif] = useState(false);
  const ultimo = useRef<{ n: number; t: number } | null>(null);
  const tocando = useRef(false);
  const ref = useRef({ foraSla, voz, notif });
  ref.current = { foraSla, voz, notif };

  const disparar = (n: number) => {
    ultimo.current = { n, t: Date.now() };
    const frase = `Atenção: ${n} ${n === 1 ? "paciente" : "pacientes"} fora do SLA de tempo de espera.`;
    toast.warning(frase, { duration: 15000 });
    if (ref.current.notif && "Notification" in window && Notification.permission === "granted") {
      try { new Notification("Maternidade em Foco — PA", { body: frase, tag: "pa-sla", requireInteraction: true }); } catch { /* ignorado */ }
    }
    if (ref.current.voz && !tocando.current) {
      tocando.current = true;
      playPaAnnouncement(n)
        .catch(() => bip())
        .finally(() => { tocando.current = false; });
    }
  };

  // Mudou o número: avisa na hora.
  useEffect(() => {
    if (foraSla == null || foraSla <= 0) { ultimo.current = null; return; }
    if (ultimo.current?.n === foraSla) return;
    disparar(foraSla);
  }, [foraSla]);

  // Lembrete a cada 5 min enquanto continuar fora do SLA.
  useEffect(() => {
    const id = setInterval(() => {
      const n = ref.current.foraSla;
      if (n && n > 0 && (!ultimo.current || Date.now() - ultimo.current.t >= LEMBRETE_MS - 1000)) disparar(n);
    }, 15000);
    return () => clearInterval(id);
  }, []);

  // Título da aba piscando enquanto houver atraso.
  useEffect(() => {
    if (!foraSla || foraSla <= 0) return;
    const original = document.title;
    let on = false;
    const id = setInterval(() => { on = !on; document.title = on ? `⚠ ${foraSla} fora do SLA` : original; }, 1500);
    return () => { clearInterval(id); document.title = original; };
  }, [foraSla]);

  const toggleNotif = async () => {
    if (notif) { setNotif(false); return; }
    if (!("Notification" in window)) { toast.error("Este navegador não suporta notificações."); return; }
    const p = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (p === "granted") setNotif(true);
    else toast.error("Permita notificações nas configurações do navegador.");
  };

  return { voz, setVoz, notif, toggleNotif };
}

function Toggle({ ativo, onClick, on, off, IconOn, IconOff }: { ativo: boolean; onClick: () => void; on: string; off: string; IconOn: typeof Bell; IconOff: typeof Bell }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={ativo}
      className={cn("inline-flex h-11 shrink-0 items-center gap-2 rounded-md border px-4 text-sm font-medium shadow-card",
        ativo ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-accent")}>
      {ativo ? <IconOn className="h-4 w-4" /> : <IconOff className="h-4 w-4" />}{ativo ? on : off}
    </button>
  );
}

export function AlertasGestorBar({ foraSla }: { foraSla: number | undefined }) {
  const a = useAlertasGestor(foraSla);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Toggle ativo={a.voz} onClick={() => a.setVoz(!a.voz)} on="Aviso de voz ativo" off="Ativar aviso de voz" IconOn={Volume2} IconOff={VolumeX} />
      <Toggle ativo={a.notif} onClick={a.toggleNotif} on="Notificações ativas" off="Ativar notificações" IconOn={Bell} IconOff={BellOff} />
      <span className="text-xs text-muted-foreground">Lembrete a cada 5 min enquanto houver atraso</span>
    </div>
  );
}
