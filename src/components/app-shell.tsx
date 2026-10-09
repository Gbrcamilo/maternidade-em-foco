import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, ChevronLeft, Menu, PanelLeftClose, PanelLeftOpen, Stethoscope, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { StaleNotice, STALE_SECONDS, useAge, usePa } from "@/lib/use-painel";
import { Button } from "@/components/ui/button";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

const items = [
  { label: "Pacientes do PA", to: "/pa", icon: Stethoscope, badge: "pa" },
  { label: "Painel para pacientes", to: "/painel-pacientes", icon: Users },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const paQ = usePa();
  const age = useAge(paQ.data?.atualizadoEm);
  const nForaSla = paQ.data && !paQ.data.aguardando && paQ.data.pa.disponivel ? paQ.data.pa.totais.foraSla : 0;
  const ok = !!paQ.data && !paQ.isError && (age == null || age <= STALE_SECONDS);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const fonte = paQ.data && !paQ.isError && !paQ.data.aguardando ? paQ.data.pa.meta?.fonte : undefined;
  if (path === "/painel-pacientes/tv") return <>{children}</>;
  const navigation = <nav aria-label="Menu principal" className="flex-1 space-y-1 p-2">{items.map((item) => <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} aria-current={path.startsWith(item.to) ? "page" : undefined} title={collapsed ? item.label : undefined} className={cn("flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors", path.startsWith(item.to) ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground")}><item.icon className="h-5 w-5 shrink-0" /><span className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>{item.label}</span>{"badge" in item && nForaSla > 0 && <span className={cn("grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-critical px-1 text-[10px] font-bold text-critical-foreground", collapsed && "lg:hidden")}>{nForaSla}</span>}</Link>)}</nav>;
  return <div className="min-h-screen bg-background text-foreground">
    <a href="#main-content" className="sr-only z-[60] rounded-md bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Ir para o conteúdo</a>
    <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-40 bg-overlay lg:hidden" /><Dialog.Content aria-describedby={undefined} className="fixed inset-y-0 left-0 z-50 flex w-[min(85vw,280px)] flex-col bg-sidebar text-sidebar-foreground lg:hidden"><div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4"><Dialog.Title className="text-sm font-bold">Maternidade em Foco</Dialog.Title><Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Fechar menu" title="Fechar menu" className="h-11 w-11 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"><X className="h-5 w-5" /></Button></Dialog.Close></div>{navigation}</Dialog.Content></Dialog.Portal></Dialog.Root>
    <aside className={cn("fixed inset-y-0 left-0 z-40 hidden flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex", collapsed ? "w-16" : "w-64")}>
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"><Activity className="h-5 w-5" /></span>{!collapsed && <div><p className="text-sm font-bold">Maternidade</p><p className="text-xs text-sidebar-muted">em Foco</p></div>}</div>
      {navigation}
      <Button variant="ghost" className="h-12 rounded-none border-t border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground" onClick={() => setCollapsed((v) => !v)} aria-label={collapsed ? "Expandir menu" : "Recolher menu"} title={collapsed ? "Expandir menu" : "Recolher menu"}>{collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <><PanelLeftClose className="h-5 w-5" /> <span className="text-xs">Recolher menu</span></>}</Button>
    </aside>
    <div className={cn("min-h-screen transition-[padding] duration-200", collapsed ? "lg:pl-16" : "lg:pl-64")}>
      <header className="sticky top-0 z-30 grid min-h-16 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b border-border bg-background/95 px-4 py-2 backdrop-blur md:px-6 lg:grid-cols-1"><Button onClick={() => setMobileOpen(true)} variant="outline" size="icon" className="h-11 w-11 shrink-0 lg:hidden" aria-label="Abrir menu"><Menu className="h-5 w-5" /></Button><div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"><span className={cn("h-2 w-2 shrink-0 rounded-full", ok ? "bg-success" : "bg-warning")} /><span className="min-w-0">{paQ.data && !paQ.isError ? "Sistema operacional" : "Fonte de dados indisponível"}</span>{age != null && <><span className="hidden sm:inline">•</span><span className="hidden sm:inline">Atualizado há {age < 60 ? `${age} segundos` : `${Math.floor(age / 60)} min`}</span></>}<StaleNotice age={age} /></div></header>
      <main id="main-content" className="mx-auto min-h-[calc(100vh-7rem)] w-full min-w-0 max-w-[1920px] p-4 md:p-6 xl:p-8">{children}</main>
      <footer className="border-t border-border px-6 py-3 text-center text-xs text-muted-foreground">{fonte === "mock" ? "Ambiente demonstrativo — dados fictícios" : "Dados operacionais — uso interno, contém informações de pacientes. Não divulgar."}</footer>
    </div>
  </div>;
}

export function PageHeader({ title, subtitle, back }: { title: string; subtitle: string; back?: string }) {
  return <div className="flex min-w-0 items-start gap-3">{back && <Link to={back} aria-label="Voltar" className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground"><ChevronLeft className="h-5 w-5" /></Link>}<div className="min-w-0"><h1 className="text-2xl font-bold tracking-normal text-foreground md:text-3xl">{title}</h1><p className="mt-1.5 text-sm leading-6 text-muted-foreground">{subtitle}</p></div></div>;
}
