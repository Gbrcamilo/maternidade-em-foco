import { cn } from "@/lib/utils";

/** Sequência institucional: iModernizar Brasil · Centro Materno Infantil ........ SUS · Prefeitura de Betim. */
export function PartnerLogos({ size = "md", className }: { size?: "md" | "lg"; className?: string }) {
  const h = size === "lg" ? "h-12 xl:h-16" : "h-8 sm:h-9 md:h-11";
  return (
    <div className={cn("flex w-full flex-wrap items-center justify-center gap-x-8 gap-y-2 sm:justify-between", className)}>
      <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <img src="/logos/imodernizar.png" alt="iModernizar Brasil" className={cn("w-auto object-contain mix-blend-multiply", h)} />
        <span aria-hidden className="hidden h-8 w-px bg-border sm:block" />
        <div className="flex items-center gap-3">
          <img src="/logos/cmi.png" alt="" className={cn("aspect-square w-auto rounded-full object-contain", h)} />
          <span className={cn("font-bold leading-tight text-[#283583]", size === "lg" ? "text-base xl:text-xl" : "text-xs md:text-sm")}>Centro<br />Materno<br />Infantil</span>
        </div>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-2">
        <img src="/logos/sus.png" alt="SUS – Sistema Único de Saúde" className={cn("w-auto object-contain mix-blend-multiply", h)} />
        <img src="/logos/prefeitura-betim.png" alt="Prefeitura de Betim – Futuro para todos" className={cn("w-auto object-contain mix-blend-multiply", h)} />
      </div>
    </div>
  );
}

export const CREDIT_TI = "Desenvolvido pela equipe de T.I CMI";
