import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Boxes, CalendarClock, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Parc matériel", icon: LayoutGrid },
  { to: "/echeances", label: "Échéances", icon: CalendarClock },
] as const;

export function AppShell({
  children,
  actions,
}: {
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <div className="atelier-haze pointer-events-none fixed inset-0" />

      <div className="relative flex min-h-screen">
        {/* Sidebar desktop */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface/70 backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="grid size-9 place-items-center rounded-lg bg-safety font-display text-sm text-safety-foreground">
              PM
            </div>
            <div className="leading-tight">
              <div className="font-display text-base tracking-wide">PARC MATÉRIEL</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Charpente métallique
              </div>
            </div>
          </div>
          <nav className="mt-2 space-y-1 px-3">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
                activeProps={{
                  className: "bg-foreground/[0.07] text-foreground ring-1 ring-border",
                }}
              >
                <n.icon className="size-4" />
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto px-4 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <Boxes className="mb-1.5 size-4" />
            Maintenance & suivi
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Barre supérieure (mobile + actions) */}
          <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
              <div className="grid size-8 place-items-center rounded-lg bg-safety font-display text-xs text-safety-foreground lg:hidden">
                PM
              </div>
              <nav className="flex gap-1 lg:hidden">
                {NAV.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    activeOptions={{ exact: n.to === "/" }}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition",
                    )}
                    activeProps={{ className: "bg-foreground/[0.07] text-foreground" }}
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>
              <div className="ml-auto flex items-center gap-2">{actions}</div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl flex-1 space-y-5 px-4 py-5 sm:px-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
