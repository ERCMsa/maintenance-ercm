import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ETATS,
  ETAT_COURT,
  ETAT_STYLE,
  formatHeure,
  type Etat,
  type Historique,
  type Materiel,
} from "@/lib/materiel";
import { cn } from "@/lib/utils";

const label = "block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground";
const champ =
  "mt-1.5 w-full rounded-md bg-foreground/5 px-3 py-2 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-safety";

export function QuickEdit({
  materiel,
  categorieNom,
  onClose,
}: {
  materiel: Materiel | null;
  categorieNom?: string | undefined;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [etat, setEtat] = useState<Etat>("Bon état");
  const [emplacement, setEmplacement] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!materiel) return;
    setEtat(materiel.etat);
    setEmplacement(materiel.emplacement);
    setNotes(materiel.notes ?? "");
  }, [materiel]);

  const historique = useQuery({
    queryKey: ["historique", materiel?.id],
    enabled: !!materiel,
    queryFn: async (): Promise<Historique[]> => {
      const { data, error } = await supabase
        .from("materiel_historique")
        .select("*")
        .eq("materiel_id", materiel!.id)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (emplacement.length > 120) throw new Error("Emplacement trop long");
      if (notes.length > 1000) throw new Error("Notes trop longues");
      const { error } = await supabase
        .from("materiel")
        .update({ etat, emplacement: emplacement.trim(), notes: notes.trim() || null })
        .eq("id", materiel!.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materiel"] });
      qc.invalidateQueries({ queryKey: ["historique", materiel?.id] });
      toast.success("Fiche mise à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!materiel) {
    return (
      <div className="glass-panel rounded-xl p-4">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-steel">
          Édition rapide
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Sélectionnez un engin dans la liste pour mettre à jour son état et son emplacement.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-rise rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-steel">
          Édition rapide
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

      <span className={cn(label, "mt-4")}>État</span>
      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        {ETATS.map((e) => (
          <button
            key={e}
            onClick={() => setEtat(e)}
            className={cn(
              "rounded-md py-2 text-xs font-medium ring-1 ring-border transition",
              etat === e
                ? cn(ETAT_STYLE[e].badge, "font-semibold ring-2")
                : "bg-background/60 text-muted-foreground hover:bg-foreground/5",
            )}
          >
            {ETAT_COURT[e]}
          </button>
        ))}
      </div>

      <label className={cn(label, "mt-4")} htmlFor="qe-empl">
        Emplacement
      </label>
      <input
        id="qe-empl"
        className={champ}
        value={emplacement}
        maxLength={120}
        placeholder="Chantier, atelier, réparation…"
        onChange={(e) => setEmplacement(e.target.value)}
      />

      <label className={cn(label, "mt-4")} htmlFor="qe-notes">
        Notes
      </label>
      <textarea
        id="qe-notes"
        rows={2}
        className={cn(champ, "resize-none")}
        value={notes}
        maxLength={1000}
        placeholder="Observation terrain…"
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="mt-4 flex gap-2">
        <button
          disabled={save.isPending}
          onClick={() => save.mutate()}
          className="flex-1 rounded-md bg-foreground py-2.5 text-sm font-semibold text-background transition hover:brightness-110 disabled:opacity-60"
        >
          {save.isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          onClick={onClose}
          className="rounded-md bg-background/60 px-3 py-2.5 text-sm font-medium ring-1 ring-border transition hover:bg-foreground/5"
        >
          Annuler
        </button>
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          Derniers changements
        </div>
        {historique.data && historique.data.length > 0 ? (
          <ul className="mt-2 space-y-1.5 text-xs">
            {historique.data.map((h) => (
              <li key={h.id} className="flex gap-2">
                <span
                  className={cn(
                    "mt-1 size-1.5 shrink-0 rounded-full",
                    h.champ === "etat" && h.nouvelle_valeur
                      ? ETAT_STYLE[h.nouvelle_valeur as Etat].dot
                      : "bg-steel",
                  )}
                />
                <span className="text-foreground">
                  {h.champ === "etat" ? "État" : "Emplacement"} → {h.nouvelle_valeur || "—"}
                </span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  {formatHeure(h.created_at)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Aucun changement enregistré.</p>
        )}
      </div>
    </div>
  );
}
