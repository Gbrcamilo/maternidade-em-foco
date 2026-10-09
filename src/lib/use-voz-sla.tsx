import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { playPaAnnouncement } from "./stream-speech";
import { cn } from "./utils";

/**
 * Aviso de voz do PA: quando ativado, anuncia "Atenção, N pacientes fora do
 * SLA de tempo de espera" sempre que houver pacientes fora do SLA e o número
 * mudar. Navegadores exigem um clique antes de liberar o som, por isso o
 * aviso só funciona depois de ativado pelo botão.
 */
export function useVozSla(foraSla: number | undefined) {
  const [ativo, setAtivo] = useState(false);
  const ultimoAnunciado = useRef<number | null>(null);
  const tocando = useRef(false);

  useEffect(() => {
    if (!ativo || foraSla == null || foraSla <= 0) return;
    if (ultimoAnunciado.current === foraSla || tocando.current) return;
    ultimoAnunciado.current = foraSla;
    tocando.current = true;
    playPaAnnouncement(foraSla)
      .catch(() => toast.error("Não foi possível tocar o aviso de voz."))
      .finally(() => {
        tocando.current = false;
      });
  }, [ativo, foraSla]);

  return { ativo, setAtivo };
}

export function BotaoVozSla({ ativo, onToggle, dark }: { ativo: boolean; onToggle: () => void; dark?: boolean }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={ativo}
      title={ativo ? "Desativar aviso de voz" : "Ativar aviso de voz"}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-2 rounded-md border px-4 text-sm font-medium shadow-card",
        ativo
          ? "border-primary bg-primary text-primary-foreground"
          : dark
            ? "border-border bg-card text-muted-foreground hover:text-foreground"
            : "border-border bg-card text-foreground hover:bg-accent",
      )}
    >
      {ativo ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      {ativo ? "Aviso de voz ativo" : "Ativar aviso de voz"}
    </button>
  );
}
