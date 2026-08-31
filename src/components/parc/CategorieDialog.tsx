import { useState } from "react";
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
import { ICONES_DISPONIBLES, iconePourCategorie, type Categorie } from "@/lib/materiel";
import { cn } from "@/lib/utils";

const schema = z.object({
  nom: z.string().trim().min(1, "Nom obligatoire").max(50, "Nom trop long"),
});

export function CategorieDialog({
  open,
  onOpenChange,
  categories,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categories: Categorie[];
}) {
  const qc = useQueryClient();
  const [nom, setNom] = useState("");
  const [icone, setIcone] = useState("box");

  const ajouter = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({ nom });
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      const { error } = await supabase
        .from("categories")
        .insert({ nom: parsed.data.nom, icone, ordre: categories.length + 1 });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setNom("");
      toast.success("Catégorie ajoutée");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-wide">Catégories</DialogTitle>
        </DialogHeader>

        <ul className="space-y-1.5">
          {categories.map((c) => {
            const Icone = iconePourCategorie(c.icone);
            return (
              <li
                key={c.id}
                className="flex items-center gap-2 rounded-md bg-foreground/5 px-3 py-2 text-sm"
              >
                <Icone className="size-4 text-steel" />
                {c.nom}
              </li>
            );
          })}
        </ul>

        <div className="mt-2 space-y-2 border-t border-border pt-3">
          <label
            className="block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground"
            htmlFor="new-cat"
          >
            Nouvelle catégorie
          </label>
          <input
            id="new-cat"
            value={nom}
            maxLength={50}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex : Compresseur"
            className="w-full rounded-md bg-foreground/5 px-3 py-2 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-safety"
          />
          <div className="flex flex-wrap gap-1.5">
            {ICONES_DISPONIBLES.map((key) => {
              const Icone = iconePourCategorie(key);
              return (
                <button
                  key={key}
                  onClick={() => setIcone(key)}
                  className={cn(
                    "grid size-9 place-items-center rounded-md ring-1 ring-border transition",
                    icone === key ? "bg-safety text-safety-foreground" : "hover:bg-foreground/5",
                  )}
                  aria-label={key}
                >
                  <Icone className="size-4" />
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <button
            disabled={ajouter.isPending}
            onClick={() => ajouter.mutate()}
            className="rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:brightness-110 disabled:opacity-60"
          >
            Ajouter la catégorie
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
