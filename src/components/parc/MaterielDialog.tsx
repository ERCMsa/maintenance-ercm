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
import { ETATS, ETAT_STYLE, type Categorie, type Etat, type Materiel } from "@/lib/materiel";
import { cn } from "@/lib/utils";

const schema = z.object({
  nom: z.string().trim().min(1, "Le nom est obligatoire").max(80, "Nom trop long (80 max)"),
  categorie_id: z.string().uuid("Choisissez une catégorie"),
  capacite: z.string().trim().max(30, "Capacité trop longue").optional(),
  annee: z
    .union([z.literal(""), z.coerce.number().int().min(1900).max(2100)])
    .optional(),
  identifiant_complementaire: z.string().trim().max(60, "Identifiant trop long").optional(),
  etat: z.enum(["Bon état", "État moyen", "Mauvais état"]),
  emplacement: z.string().trim().max(120, "Emplacement trop long"),
  notes: z.string().trim().max(1000, "Notes trop longues").optional(),
});

const champ =
  "mt-1.5 w-full rounded-md bg-foreground/5 px-3 py-2 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-safety";
const label = "block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categories: Categorie[];
  materiel?: Materiel | null;
};

export function MaterielDialog({ open, onOpenChange, categories, materiel }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    nom: "",
    categorie_id: categories[0]?.id ?? "",
    capacite: "",
    annee: "",
    identifiant_complementaire: "",
    etat: "Bon état" as Etat,
    emplacement: "",
    notes: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      nom: materiel?.nom ?? "",
      categorie_id: materiel?.categorie_id ?? categories[0]?.id ?? "",
      capacite: materiel?.capacite ?? "",
      annee: materiel?.annee ? String(materiel.annee) : "",
      identifiant_complementaire: materiel?.identifiant_complementaire ?? "",
      etat: materiel?.etat ?? "Bon état",
      emplacement: materiel?.emplacement ?? "",
      notes: materiel?.notes ?? "",
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
        etat: v.etat,
        emplacement: v.emplacement,
        notes: v.notes || null,
      };
      const { error } = materiel
        ? await supabase.from("materiel").update(payload).eq("id", materiel.id)
        : await supabase.from("materiel").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materiel"] });
      toast.success(materiel ? "Engin mis à jour" : "Engin ajouté");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-wide">
            {materiel ? "Modifier l'engin" : "Ajouter un engin"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
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
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="cat">
                Catégorie
              </label>
              <select
                id="cat"
                className={champ}
                value={form.categorie_id}
                onChange={(e) => setForm({ ...form, categorie_id: e.target.value })}
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
                onChange={(e) => setForm({ ...form, capacite: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                onChange={(e) => setForm({ ...form, annee: e.target.value.replace(/\D/g, "") })}
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
                onChange={(e) =>
                  setForm({ ...form, identifiant_complementaire: e.target.value })
                }
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
                  onClick={() => setForm({ ...form, etat: e })}
                  className={cn(
                    "rounded-md py-2 text-xs font-medium ring-1 ring-border transition",
                    form.etat === e
                      ? cn(ETAT_STYLE[e].badge, "font-semibold ring-2")
                      : "bg-background/60 text-muted-foreground hover:bg-foreground/5",
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
              onChange={(e) => setForm({ ...form, emplacement: e.target.value })}
            />
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
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md bg-background/60 px-3 py-2.5 text-sm font-medium ring-1 ring-border transition hover:bg-foreground/5"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:brightness-110 disabled:opacity-60"
          >
            {mutation.isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
