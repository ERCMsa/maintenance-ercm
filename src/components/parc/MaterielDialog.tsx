import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DateField } from "@/components/parc/DateField";
import { PhotoField } from "@/components/parc/PhotoField";
import { ETATS, ETAT_STYLE, type Categorie, type Etat, type Materiel } from "@/lib/materiel";
import { cn } from "@/lib/utils";

const dateStr = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide")]);

const schema = z.object({
  nom: z.string().trim().min(1, "Le nom est obligatoire").max(80, "Nom trop long (80 max)"),
  categorie_id: z.string().uuid("Choisissez une catégorie"),
  capacite: z.string().trim().max(30, "Capacité trop longue").optional(),
  annee: z
    .union([z.literal(""), z.coerce.number().int().min(1900).max(2100)])
    .optional(),
  identifiant_complementaire: z.string().trim().max(60, "Identifiant trop long").optional(),
  photo_url: z.string().optional(),
  date_mise_en_place: dateStr,
  etat: z.enum(["Bon état", "État moyen", "Mauvais état"]),
  notes: z.string().trim().max(1000, "Notes trop longues").optional(),
  date_controle_technique: dateStr,
  date_prochain_controle_technique: dateStr,
  date_debut_assurance: dateStr,
  date_fin_assurance: dateStr,
  date_dernier_entretien: dateStr,
  date_prochain_entretien: dateStr,
});

const champ =
  "mt-1.5 w-full rounded-lg bg-foreground/5 px-3 py-2 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-safety";
const label = "block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categories: Categorie[];
  materiel?: Materiel | null;
};

const vide = {
  nom: "",
  categorie_id: "",
  capacite: "",
  annee: "",
  identifiant_complementaire: "",
  photo_url: "",
  date_mise_en_place: "",
  etat: "Bon état" as Etat,
  notes: "",
  date_controle_technique: "",
  date_prochain_controle_technique: "",
  date_debut_assurance: "",
  date_fin_assurance: "",
  date_dernier_entretien: "",
  date_prochain_entretien: "",
};

export function MaterielDialog({ open, onOpenChange, categories, materiel }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...vide, categorie_id: categories[0]?.id ?? "" });

  useEffect(() => {
    if (!open) return;
    setForm({
      nom: materiel?.nom ?? "",
      categorie_id: materiel?.categorie_id ?? categories[0]?.id ?? "",
      capacite: materiel?.capacite ?? "",
      annee: materiel?.annee ? String(materiel.annee) : "",
      identifiant_complementaire: materiel?.identifiant_complementaire ?? "",
      photo_url: materiel?.photo_url ?? "",
      conducteur: materiel?.conducteur ?? "",
      date_mise_en_place: materiel?.date_mise_en_place ?? "",
      etat: materiel?.etat ?? "Bon état",
      emplacement: materiel?.emplacement ?? "",
      notes: materiel?.notes ?? "",
      date_controle_technique: materiel?.date_controle_technique ?? "",
      date_prochain_controle_technique: materiel?.date_prochain_controle_technique ?? "",
      date_debut_assurance: materiel?.date_debut_assurance ?? "",
      date_fin_assurance: materiel?.date_fin_assurance ?? "",
      date_dernier_entretien: materiel?.date_dernier_entretien ?? "",
      date_prochain_entretien: materiel?.date_prochain_entretien ?? "",
    });
  }, [open, materiel, categories]);

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      const v = parsed.data;
      const payload = {
        nom: v.nom,
        categorie_id: v.categorie_id,
        capacite: v.capacite || null,
        annee: v.annee === "" || v.annee === undefined ? null : Number(v.annee),
        identifiant_complementaire: v.identifiant_complementaire || null,
        photo_url: v.photo_url || null,
        conducteur: v.conducteur || null,
        date_mise_en_place: v.date_mise_en_place || null,
        etat: v.etat,
        emplacement: v.emplacement,
        notes: v.notes || null,
        date_controle_technique: v.date_controle_technique || null,
        date_prochain_controle_technique: v.date_prochain_controle_technique || null,
        date_debut_assurance: v.date_debut_assurance || null,
        date_fin_assurance: v.date_fin_assurance || null,
        date_dernier_entretien: v.date_dernier_entretien || null,
        date_prochain_entretien: v.date_prochain_entretien || null,
      };
      const { error } = materiel
        ? await supabase.from("materiel").update(payload).eq("id", materiel.id)
        : await supabase.from("materiel").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materiel"] });
      if (materiel) qc.invalidateQueries({ queryKey: ["historique", materiel.id] });
      toast.success(materiel ? "Engin mis à jour" : "Engin ajouté");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (patch: Partial<typeof vide>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-wide">
            {materiel ? "Modifier l'engin" : "Ajouter un engin"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <PhotoField
              value={form.photo_url}
              nom={form.nom || "Engin"}
              onChange={(v) => set({ photo_url: v })}
            />
            <div>
              <label className={label} htmlFor="nom">
                Nom
              </label>
              <input
                id="nom"
                className={champ}
                value={form.nom}
                maxLength={80}
                placeholder="Sany, Volvo, Hyster…"
                onChange={(e) => set({ nom: e.target.value })}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="cat">
                  Catégorie
                </label>
                <select
                  id="cat"
                  className={champ}
                  value={form.categorie_id}
                  onChange={(e) => set({ categorie_id: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="cap">
                  Capacité
                </label>
                <input
                  id="cap"
                  className={champ}
                  value={form.capacite}
                  maxLength={30}
                  placeholder="50t, 20m…"
                  onChange={(e) => set({ capacite: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="annee">
                  Année (optionnel)
                </label>
                <input
                  id="annee"
                  className={champ}
                  inputMode="numeric"
                  value={form.annee}
                  placeholder="2013"
                  onChange={(e) => set({ annee: e.target.value.replace(/\D/g, "") })}
                />
              </div>
              <div>
                <label className={label} htmlFor="ident">
                  Identifiant compl.
                </label>
                <input
                  id="ident"
                  className={champ}
                  value={form.identifiant_complementaire}
                  maxLength={60}
                  placeholder="n°14, Bleu, vieux…"
                  onChange={(e) => set({ identifiant_complementaire: e.target.value })}
                />
              </div>
            </div>

            <div>
              <span className={label}>État</span>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {ETATS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => set({ etat: e })}
                    className={cn(
                      "rounded-lg py-2 text-xs font-medium ring-1 ring-border transition",
                      form.etat === e
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
              <label className={label} htmlFor="empl">
                Emplacement
              </label>
              <input
                id="empl"
                className={champ}
                value={form.emplacement}
                maxLength={120}
                placeholder="Chantier X, Atelier, En réparation…"
                onChange={(e) => set({ emplacement: e.target.value })}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="cond">
                  Conducteur actuel
                </label>
                <input
                  id="cond"
                  className={champ}
                  value={form.conducteur}
                  maxLength={80}
                  placeholder="Nom du conducteur"
                  onChange={(e) => set({ conducteur: e.target.value })}
                />
              </div>
              <DateField
                label="Date de mise en place"
                value={form.date_mise_en_place}
                onChange={(v) => set({ date_mise_en_place: v })}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-xl panel-2 p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel">
              Contrôle technique
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <DateField
                label="Dernier contrôle"
                value={form.date_controle_technique}
                onChange={(v) => set({ date_controle_technique: v })}
              />
              <DateField
                label="Prochain contrôle"
                alerte
                value={form.date_prochain_controle_technique}
                onChange={(v) => set({ date_prochain_controle_technique: v })}
              />
            </div>

            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel">
              Assurance
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <DateField
                label="Début d'assurance"
                value={form.date_debut_assurance}
                onChange={(v) => set({ date_debut_assurance: v })}
              />
              <DateField
                label="Fin d'assurance"
                alerte
                value={form.date_fin_assurance}
                onChange={(v) => set({ date_fin_assurance: v })}
              />
            </div>

            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel">
              Entretien
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <DateField
                label="Dernier entretien"
                value={form.date_dernier_entretien}
                onChange={(v) => set({ date_dernier_entretien: v })}
              />
              <DateField
                label="Prochain entretien"
                alerte
                value={form.date_prochain_entretien}
                onChange={(v) => set({ date_prochain_entretien: v })}
              />
            </div>
          </div>

          <div>
            <label className={label} htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              rows={2}
              className={cn(champ, "resize-none")}
              value={form.notes}
              maxLength={1000}
              onChange={(e) => set({ notes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg bg-foreground/5 px-3 py-2.5 text-sm font-medium ring-1 ring-border transition hover:bg-foreground/10"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="rounded-lg bg-safety px-4 py-2.5 text-sm font-semibold text-safety-foreground transition hover:brightness-110 disabled:opacity-60"
          >
            {mutation.isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
