import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useJournal, totalHeures } from "@/components/parc/JournalSection";
import { ETAT_STYLE, type Materiel } from "@/lib/materiel";
import { formatDateFR } from "@/lib/echeances";
import { cn } from "@/lib/utils";

export function JournalPanel({
  materiel,
  categorieNom,
  onClose,
}: {
  materiel: Materiel | null;
  categorieNom?: string | undefined;
  onClose: () => void;
}) {
  const journal = useJournal(materiel?.id ?? "");
  const entrees = materiel ? (journal.data ?? []) : [];

  if (!materiel) {
    return (
      <div className="glass-panel rounded-xl p-4">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-steel">
          Journal de travail
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Sélectionnez un engin dans la liste pour afficher son journal de travail.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-rise rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-steel">
          Journal de travail
        </div>
        <button
          onClick={onClose}
          className="rounded px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-foreground/5"
        >
          Fermer
        </button>
      </div>

      <div className="mt-3 font-semibold">
        {materiel.nom}
        {categorieNom ? ` — ${categorieNom}` : ""}
        {materiel.capacite ? ` ${materiel.capacite}` : ""}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-safety/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-safety">
          {totalHeures(entrees).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} h cumulées
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {entrees.length} entrée{entrees.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {journal.isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : entrees.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune entrée de travail enregistrée.</p>
        ) : (
          entrees.map((e) => (
            <div key={e.id} className="rounded-lg panel-2 p-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">{formatDateFR(e.date)}</span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    ETAT_STYLE[e.etat].badge,
                  )}
                >
                  {e.etat}
                </span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {Number(e.heures).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} h
                </span>
              </div>
              {e.etat_notes && (
                <p className="mt-1 text-xs text-muted-foreground">{e.etat_notes}</p>
              )}
            </div>
          ))
        )}
      </div>

      <Link
        to="/materiel/$id"
        params={{ id: materiel.id }}
        className="mt-4 inline-flex items-center gap-1 rounded-lg bg-foreground/5 px-2.5 py-1.5 text-xs font-medium ring-1 ring-border transition hover:bg-foreground/10"
      >
        Ouvrir la fiche complète <ChevronRight className="size-3" />
      </Link>
    </div>
  );
}
