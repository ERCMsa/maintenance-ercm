import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/parc/AppShell";
import { sigle, type Materiel } from "@/lib/materiel";
import { echeances, formatDateFR, STATUT_STYLE, type StatutEcheance } from "@/lib/echeances";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/echeances")({
  head: () => ({
    meta: [
      { title: "Échéances du parc — Parc Matériel" },
      {
        name: "description",
        content:
          "Toutes les échéances de contrôle technique, d'assurance et d'entretien du parc, triées de la plus urgente à la plus lointaine.",
      },
      { property: "og:title", content: "Échéances du parc — Parc Matériel" },
      {
        property: "og:description",
        content: "Contrôles techniques, assurances et entretiens à venir ou dépassés.",
      },
    ],
  }),
  component: EcheancesPage,
});

function EcheancesPage() {
  const materiels = useQuery({
    queryKey: ["materiel"],
    queryFn: async (): Promise<Materiel[]> => {
      const { data, error } = await supabase.from("materiel").select("*").order("nom");
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const lignes = (materiels.data ?? [])
    .flatMap((m) => echeances(m).map((e) => ({ m, e })))
    .filter(({ e }) => e.date)
    .sort((a, b) => (a.e.jours ?? 0) - (b.e.jours ?? 0));

  const compte = (s: StatutEcheance) => lignes.filter((l) => l.e.statut === s).length;

  return (
    <AppShell>
      <section className="animate-rise">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-steel">
          Maintenance
        </div>
        <h1 className="mt-1 font-display text-3xl tracking-wide sm:text-4xl">Échéances</h1>
        <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs">
          <span className="rounded-lg bg-bad/10 px-2.5 py-1.5 text-bad">
            {compte("expire")} expirées
          </span>
          <span className="rounded-lg bg-warn/10 px-2.5 py-1.5 text-warn">
            {compte("proche")} sous 30 jours
          </span>
          <span className="rounded-lg bg-ok/10 px-2.5 py-1.5 text-ok">{compte("ok")} à jour</span>
        </div>
      </section>

      <section className="glass-panel animate-rise divide-y divide-border rounded-2xl">
        {lignes.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Aucune échéance renseignée pour le moment.
          </p>
        )}
        {lignes.map(({ m, e }) => (
          <Link
            key={`${m.id}-${e.type}`}
            to="/materiel/$id"
            params={{ id: m.id }}
            className="flex items-center gap-3 p-3 transition hover:bg-foreground/5"
          >
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-steel/15 font-mono text-xs font-bold text-steel">
              {sigle(m.nom)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{m.nom}</div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                <CalendarClock className="size-3.5" />
                {e.label} · {formatDateFR(e.date)}
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                STATUT_STYLE[e.statut].badge,
              )}
            >
              {e.jours !== null && e.jours < 0
                ? `Dépassé ${Math.abs(e.jours)} j`
                : `Dans ${e.jours} j`}
            </span>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
