import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, Bell, CalendarDays, ChartNoAxesCombined, ChevronLeft, DoorOpen, HeartPulse, Menu, MonitorPlay, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Painel de Salas", to: "/", icon: DoorOpen },
  { label: "Agenda Cirúrgica", to: "/agenda", icon: CalendarDays },
  { label: "Recuperação (RPA)", to: "/recuperacao", icon: HeartPulse },
  { label: "Alertas", to: "/alertas", icon: Bell, count: 5 },
  { label: "Indicadores", to: "/indicadores", icon: ChartNoAxesCombined },
  { label: "Painel de TV", to: "/tv", icon: MonitorPlay },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  return <div className="min-h-screen bg-background text-foreground">
    {mobileOpen && <button aria-label="Fechar menu" className="fixed inset-0 z-40 bg-overlay lg:hidden" onClick={() => setMobileOpen(false)} />}
    <aside className={cn("fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200", collapsed ? "lg:w-16" : "lg:w-64", mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0")}>
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"><Activity className="h-5 w-5" /></span>{!collapsed && <div><p className="text-sm font-bold">Centro Cirúrgico</p><p className="text-xs text-sidebar-muted">Materno</p></div>}</div>
      <nav className="flex-1 space-y-1 p-2">{items.map((item) => { const active = item.to === "/" ? path === "/" || path.startsWith("/salas/") : path.startsWith(item.to); return <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} title={collapsed ? item.label : undefined} className={cn("flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground")}><item.icon className="h-5 w-5 shrink-0" />{!collapsed && <span className="flex-1">{item.label}</span>}{!collapsed && "count" in item && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-critical px-1 text-[10px] font-bold text-critical-foreground">{item.count}</span>}</Link>; })}</nav>
      <button className="hidden h-12 items-center justify-center border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground lg:flex" onClick={() => setCollapsed((v) => !v)} title={collapsed ? "Expandir menu" : "Recolher menu"}>{collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <><PanelLeftClose className="h-5 w-5" /> <span className="ml-2 text-xs">Recolher menu</span></>}</button>
    </aside>
    <div className={cn("min-h-screen transition-[padding] duration-200", collapsed ? "lg:pl-16" : "lg:pl-64")}>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-6"><button onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-md border border-border lg:hidden" aria-label="Abrir menu"><Menu className="h-5 w-5" /></button><div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><span className="h-2 w-2 rounded-full bg-success" /><span>Sistema operacional</span><span>•</span><span>Atualizado há 12 segundos</span></div><Link to="/alertas" className="relative grid h-9 w-9 place-items-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground" aria-label="Ver 5 alertas"><Bell className="h-4 w-4" /><span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-critical px-1 text-[9px] font-bold text-critical-foreground">5</span></Link></header>
      <main className="mx-auto min-h-[calc(100vh-7rem)] max-w-[1680px] p-4 md:p-6 xl:p-8">{children}</main>
      <footer className="border-t border-border px-6 py-3 text-center text-xs text-muted-foreground">Ambiente demonstrativo — dados fictícios e mascarados</footer>
    </div>
  </div>;
}

export function PageHeader({ title, subtitle, back }: { title: string; subtitle: string; back?: string }) {
  return <div className="mb-6 flex items-start gap-3">{back && <Link to={back} className="mt-0.5 grid h-9 w-9 place-items-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground"><ChevronLeft className="h-5 w-5" /></Link>}<div><h1 className="text-2xl font-bold tracking-normal text-foreground md:text-3xl">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p></div></div>;
}