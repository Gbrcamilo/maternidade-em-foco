import { useEffect, useState } from "react";
import { Contrast, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = [100, 112, 125, 150] as const;
const KEY = "painel-a11y";

function load(): { size: number; contrast: boolean } {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}") as { size?: number; contrast?: boolean };
    return { size: SIZES.includes(raw.size as never) ? (raw.size as number) : 100, contrast: raw.contrast === true };
  } catch {
    return { size: 100, contrast: false };
  }
}

/** Tamanho da fonte e alto contraste para a página pública. A preferência fica só neste aparelho. */
export function A11yToolbar({ className }: { className?: string }) {
  const [state, setState] = useState({ size: 100, contrast: false });

  useEffect(() => { setState(load()); }, []);
  useEffect(() => {
    document.documentElement.style.fontSize = `${state.size}%`;
    document.documentElement.classList.toggle("contrast-high", state.contrast);
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* sem armazenamento: segue sem lembrar */ }
    return () => { document.documentElement.style.fontSize = ""; document.documentElement.classList.remove("contrast-high"); };
  }, [state]);

  const step = (dir: 1 | -1) => setState((s) => {
    const i = SIZES.indexOf(s.size as (typeof SIZES)[number]);
    return { ...s, size: SIZES[Math.min(SIZES.length - 1, Math.max(0, i + dir))] ?? 100 };
  });
  const btn = "inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-semibold text-foreground hover:bg-accent";

  return (
    <div role="group" aria-label="Acessibilidade" className={cn("flex flex-wrap items-center gap-2", className)}>
      <button type="button" className={btn} onClick={() => step(-1)} disabled={state.size === SIZES[0]} aria-label="Diminuir o tamanho do texto"><Minus className="h-4 w-4" />A</button>
      <button type="button" className={btn} onClick={() => step(1)} disabled={state.size === SIZES[SIZES.length - 1]} aria-label="Aumentar o tamanho do texto"><Plus className="h-4 w-4" />A</button>
      <button type="button" className={cn(btn, state.contrast && "border-primary bg-primary text-primary-foreground hover:bg-primary/90")} onClick={() => setState((s) => ({ ...s, contrast: !s.contrast }))} aria-pressed={state.contrast}><Contrast className="h-4 w-4" />Contraste</button>
    </div>
  );
}
