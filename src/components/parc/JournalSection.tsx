import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DateField } from "@/components/parc/DateField";
import { ETATS, ETAT_STYLE, type Etat, type Journal, type Materiel } from "@/lib/materiel";
import { formatDateFR } from "@/lib/echeances";
import { cn } from "@/lib/utils";

const label = "block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground";
const champ =
  "mt-1.5 w-full rounded-lg bg-foreground/5 px-3 py-2 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-safety";

function aujourdhui(): string {
  const d = new Date();
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
}

export function useJournal(materielId: string) {
  return useQuery({
    queryKey: ["journal", materielId],
    queryFn: async (): Promise<Journal[]> => {
      const { data, error } = await supabase
        .from("materiel_journal")
        .select("*")
        .eq("materiel_id", materielId)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function totalHeures(entrees: Journal[]): number {
  return entrees.reduce((s, e) => s + Number(e.heures ?? 0), 0);
}

export function JournalSection({ materiel }: { materiel: Materiel }) {
  const qc = useQueryClient();
  const journal = useJournal(materiel.id);
  const entrees = journal.data ?? [];

  const [ouvert, setOuvert] = useState(false);
  const [date, setDate] = useState(aujourdhui());
  const [emplacement, setEmplacement] = useState(materiel.emplacement);
  const [etat, setEtat] = useState<Etat>(materiel.etat);
  const [etatNotes, setEtatNotes] = useState("");
  const [heures, setHeures] = useState("");
  const [conducteur, setConducteur] = useState(materiel.conducteur ?? "");

  useEffect(() => {
    if (!ouvert) return;
    setDate(aujourdhui());
    setEmplacement(materiel.emplacement);
    setEtat(materiel.etat);
    setEtatNotes("");
    setHeures("");
    setConducteur(materiel.conducteur ?? "");
  }, [ouvert, materiel]);

  const ajouter = useMutation({
    mutationFn: async () => {
      if (!date) throw new Error("La date est obligatoire");
      const h = Number(heures.replace(",", "."));
      if (!Number.isFinite(h) || h < 0 || h > 24 * 30) throw new Error("Heures invalides");
      const { error } = await supabase.from("materiel_journal").insert({
        materiel_id: materiel.id,
        date,
        emplacement: emplacement.trim(),
        etat,
        etat_notes: etatNotes.trim() || null,
        heures: h,
        conducteur: conducteur.trim() || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal", materiel.id] });
      toast.success("Entrée ajoutée au journal");
      setOuvert(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const supprimer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("materiel_journal").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal", materiel.id] });
      toast.success("Entrée supprimée");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="glass-panel animate-rise rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-lg tracking-wide">Journal de travail</h2>
        <span className="rounded-full bg-safety/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-safety">
          {totalHeures(entrees).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} h cumulées
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {entrees.length} entrée{entrees.length > 1 ? "s" : ""}
        </span>
        <button
          onClick={() => setOuvert((v) => !v)}
          className="no-print ml-auto inline-flex items-center gap-1.5 rounded-lg bg-safety px-3 py-2 text-sm font-semibold text-safety-foreground transition hover:brightness-110"
        >
          <Plus className="size-4" /> {ouvert ? "Fermer" : "Ajouter une entrée"}
        </button>
      </div>

      {ouvert && (
        <div className="no-print mt-4 space-y-3 rounded-xl panel-2 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <DateField label="Date" value={date} onChange={setDate} />
            <div>
              <label className={label} htmlFor="j-cond">
                Conducteur
              </label>
              <input
                id="j-cond"
                className={champ}
                value={conducteur}
                maxLength={80}
                placeholder="Nom du conducteur"
                onChange={(e) => setConducteur(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="j-empl">
                Emplacement / chantier
              </label>
              <input
                id="j-empl"
                className={champ}
                value={emplacement}
                maxLength={120}
                placeholder="Chantier, atelier…"
                onChange={(e) => setEmplacement(e.target.value)}
              />
            </div>
            <div>
              <label className={label} htmlFor="j-heures">
                Heures travaillées
              </label>
              <input
                id="j-heures"
                className={champ}
                inputMode="decimal"
                value={heures}
                placeholder="7,5"
                onChange={(e) => setHeures(e.target.value.replace(/[^\d.,]/g, ""))}
              />
            </div>
          </div>
          <div>
            <span className={label}>État constaté</span>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {ETATS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEtat(e)}
                  className={cn(
                    "rounded-lg py-2 text-xs font-medium ring-1 ring-border transition",
                    etat === e
                      ? cn(ETAT_STYLE[e].badge, "font-semibold ring-2")
                      : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={label} htmlFor="j-notes">
              Observation (optionnel)
            </label>
            <textarea
              id="j-notes"
              rows={2}
              className={cn(champ, "resize-none")}
              value={etatNotes}
              maxLength={500}
              placeholder="Fuite hydraulique, révision à prévoir…"
              onChange={(e) => setEtatNotes(e.target.value)}
            />
          </div>
          <button
            disabled={ajouter.isPending}
            onClick={() => ajouter.mutate()}
            className="w-full rounded-lg bg-foreground py-2.5 text-sm font-semibold text-background transition hover:brightness-110 disabled:opacity-60"
          >
            {ajouter.isPending ? "Enregistrement…" : "Enregistrer l'entrée"}
          </button>
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        {entrees.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune entrée de travail enregistrée.</p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Emplacement</th>
                <th className="py-2 pr-3">État</th>
                <th className="py-2 pr-3">Heures</th>
                <th className="py-2 pr-3">Conducteur</th>
                <th className="no-print py-2" />
              </tr>
            </thead>
            <tbody>
              {entrees.map((e) => (
                <tr key={e.id} className="border-b border-border/60 align-top">
                  <td className="py-2 pr-3 font-mono text-xs">{formatDateFR(e.date)}</td>
                  <td className="py-2 pr-3">
                    {e.emplacement || "—"}
                    {e.etat_notes && (
                      <div className="text-xs text-muted-foreground">{e.etat_notes}</div>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        ETAT_STYLE[e.etat].badge,
                      )}
                    >
                      {e.etat}
                    </span>
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">
                    {Number(e.heures).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} h
                  </td>
                  <td className="py-2 pr-3">{e.conducteur || "—"}</td>
                  <td className="no-print py-2 text-right">
                    <button
                      onClick={() => supprimer.mutate(e.id)}
                      aria-label="Supprimer l'entrée"
                      className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-bad/10 hover:text-bad"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
