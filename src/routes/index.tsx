import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MaterielDialog } from "@/components/parc/MaterielDialog";
import { CategorieDialog } from "@/components/parc/CategorieDialog";
import { QuickEdit } from "@/components/parc/QuickEdit";
import {
  ETATS,
  ETAT_STYLE,
  formatDateCourte,
  iconePourCategorie,
  resumeEtats,
  sigle,
  type Categorie,
  type Etat,
  type Materiel,
} from "@/lib/materiel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Parc Matériel — Suivi des engins de chantier" },
      {
        name: "description",
        content:
          "Tableau de bord du parc matériel : état, emplacement et historique de chaque grue, camion-grue, chariot, nacelle, générateur et véhicule.",
      },
      { property: "og:title", content: "Parc Matériel — Suivi des engins de chantier" },
      {
        property: "og:description",
        content: "État, emplacement et historique de tous les engins de l'entreprise.",
      },
    ],
  }),
  component: ParcPage,
});

function ParcPage() {
  const qc = useQueryClient();
  const [recherche, setRecherche] = useState("");
  const [filtreEtat, setFiltreEtat] = useState<Etat | "Tous">("Tous");
  const [filtreCategorie, setFiltreCategorie] = useState<string | "Toutes">("Toutes");
  const [selection, setSelection] = useState<string | null>(null);
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState<Materiel | null>(null);
  const [catDialog, setCatDialog] = useState(false);
  const [aSupprimer, setASupprimer] = useState<Materiel | null>(null);

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Categorie[]> => {
      const { data, error } = await supabase.from("categories").select("*").order("ordre");
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const materiels = useQuery({
    queryKey: ["materiel"],
    queryFn: async (): Promise<Materiel[]> => {
      const { data, error } = await supabase.from("materiel").select("*").order("nom");
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const supprimer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("materiel").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materiel"] });
      toast.success("Engin supprimé");
      setASupprimer(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cats = categories.data ?? [];
  const tous = materiels.data ?? [];

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return tous.filter((m) => {
      if (filtreEtat !== "Tous" && m.etat !== filtreEtat) return false;
      if (filtreCategorie !== "Toutes" && m.categorie_id !== filtreCategorie) return false;
      if (!q) return true;
      return [m.nom, m.capacite, m.identifiant_complementaire, m.emplacement]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [tous, recherche, filtreEtat, filtreCategorie]);

  const global = resumeEtats(tous);
  const selectionne = tous.find((m) => m.id === selection) ?? null;

  return (
    <div className="relative min-h-screen">
      <div className="atelier-haze pointer-events-none fixed inset-0" />

      <div className="relative">
        <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5 sm:px-6">
            <div className="grid size-9 place-items-center rounded-md bg-foreground font-display text-sm tracking-wide text-background">
              PM
            </div>
            <div className="leading-tight">
              <div className="font-display text-base tracking-wide">PARC&nbsp;MATÉRIEL</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Charpente · Gestion engins
              </div>
            </div>
            <div className="ml-auto hidden items-center gap-2 font-mono text-xs text-muted-foreground sm:flex">
              <span className="size-1.5 animate-softpulse rounded-full bg-ok" />
              <span>{global.total} ENGINS</span>
            </div>
            <button
              onClick={() => setCatDialog(true)}
              className="rounded-md bg-background/60 px-3 py-2 text-sm font-medium ring-1 ring-border transition hover:bg-foreground/5"
            >
              Catégories
            </button>
            <button
              onClick={() => {
                setEnEdition(null);
                setDialogOuvert(true);
              }}
              className="inline-flex items-center gap-1 rounded-md bg-safety px-3.5 py-2 text-sm font-semibold text-safety-foreground ring-1 ring-border transition hover:brightness-105"
            >
              <Plus className="size-4" /> Ajouter
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6">
          <section className="animate-rise flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-steel">
                (a) Synthèse du parc
              </div>
              <h1 className="mt-1 font-display text-3xl tracking-wide sm:text-4xl">
                Parc matériel
              </h1>
            </div>
            <div className="flex flex-wrap gap-2 font-mono text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-ok/10 px-2.5 py-1.5 text-ok">
                <span className="size-1.5 rounded-full bg-ok" />
                {global.bon} bon état
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-warn/10 px-2.5 py-1.5 text-warn">
                <span className="size-1.5 rounded-full bg-warn" />
                {global.moyen} moyen
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-bad/10 px-2.5 py-1.5 text-bad">
                <span className="size-1.5 rounded-full bg-bad" />
                {global.mauvais} mauvais
              </span>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <button
              onClick={() => setFiltreCategorie("Toutes")}
              className={cn(
                "glass-panel animate-rise rounded-xl border-l-4 border-safety p-3 text-left transition hover:brightness-105 sm:col-span-2 sm:border-l-0 sm:py-3.5",
                filtreCategorie === "Toutes" && "ring-2 ring-safety",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  Tous
                </span>
                <span className="etch font-display text-2xl leading-none">{global.total}</span>
              </div>
              <Repartition bon={global.bon} moyen={global.moyen} mauvais={global.mauvais} />
            </button>

            {cats.map((c) => {
              const r = resumeEtats(tous.filter((m) => m.categorie_id === c.id));
              const Icone = iconePourCategorie(c.icone);
              return (
                <button
                  key={c.id}
                  onClick={() => setFiltreCategorie(filtreCategorie === c.id ? "Toutes" : c.id)}
                  className={cn(
                    "glass-panel animate-rise rounded-xl border-l-4 border-safety p-3 text-left transition hover:brightness-105",
                    filtreCategorie === c.id && "ring-2 ring-safety",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      <Icone className="size-3.5 shrink-0 text-steel" />
                      <span className="truncate">{c.nom}</span>
                    </span>
                    <span className="etch font-display text-2xl leading-none">{r.total}</span>
                  </div>
                  <Repartition bon={r.bon} moyen={r.moyen} mauvais={r.mauvais} />
                </button>
              );
            })}
          </section>

          <section className="glass-panel animate-rise flex flex-wrap items-center gap-2 rounded-xl p-2.5">
            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg bg-foreground/5 px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher un engin, un n°…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["Tous", ...ETATS] as const).map((e) => (
                <button
                  key={e}
                  onClick={() => setFiltreEtat(e)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-xs font-medium ring-1 ring-border transition",
                    filtreEtat === e
                      ? "bg-steel font-semibold text-background"
                      : "bg-background/60 hover:bg-foreground/5",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_330px]">
            <div className="space-y-6">
              {materiels.isLoading && (
                <p className="font-mono text-xs text-muted-foreground">Chargement du parc…</p>
              )}
              {!materiels.isLoading && filtres.length === 0 && (
                <div className="glass-panel rounded-xl p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Aucun engin ne correspond. Ajoutez votre premier engin pour démarrer le
                    registre.
                  </p>
                </div>
              )}

              {cats.map((c, index) => {
                const items = filtres.filter((m) => m.categorie_id === c.id);
                if (items.length === 0) return null;
                const r = resumeEtats(items);
                return (
                  <section key={c.id} className="animate-rise">
                    <div className="mb-2.5 flex items-center gap-2.5">
                      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-steel">
                        ({String.fromCharCode(98 + index)})
                      </span>
                      <h2 className="font-display text-lg tracking-wide">{c.nom}</h2>
                      <span className="font-mono text-xs text-muted-foreground">
                        {r.total} engin{r.total > 1 ? "s" : ""}
                      </span>
                      <span className="ml-auto flex gap-1.5 font-mono text-[10px]">
                        <span className="rounded bg-ok/10 px-1.5 py-0.5 text-ok">{r.bon}</span>
                        <span className="rounded bg-warn/10 px-1.5 py-0.5 text-warn">
                          {r.moyen}
                        </span>
                        <span className="rounded bg-bad/10 px-1.5 py-0.5 text-bad">
                          {r.mauvais}
                        </span>
                      </span>
                    </div>
                    <div className="space-y-2">
                      {items.map((m) => (
                        <LigneEngin
                          key={m.id}
                          materiel={m}
                          actif={selection === m.id}
                          onSelect={() => setSelection(m.id)}
                          onEdit={() => {
                            setEnEdition(m);
                            setDialogOuvert(true);
                          }}
                          onDelete={() => setASupprimer(m)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            <aside className="lg:sticky lg:top-16 lg:self-start">
              <QuickEdit
                materiel={selectionne}
                categorieNom={cats.find((c) => c.id === selectionne?.categorie_id)?.nom}
                onClose={() => setSelection(null)}
              />
            </aside>
          </section>
        </main>
      </div>

      <MaterielDialog
        open={dialogOuvert}
        onOpenChange={setDialogOuvert}
        categories={cats}
        materiel={enEdition}
      />
      <CategorieDialog open={catDialog} onOpenChange={setCatDialog} categories={cats} />

      <AlertDialog open={!!aSupprimer} onOpenChange={(v) => !v && setASupprimer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {aSupprimer?.nom} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive : la fiche et son historique seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => aSupprimer && supprimer.mutate(aSupprimer.id)}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Repartition({ bon, moyen, mauvais }: { bon: number; moyen: number; mauvais: number }) {
  const total = Math.max(bon + moyen + mauvais, 1);
  return (
    <>
      <div className="mt-3 flex gap-1.5">
        <span className="h-1.5 rounded-full bg-ok" style={{ flex: bon / total || 0.02 }} />
        <span className="h-1.5 rounded-full bg-warn" style={{ flex: moyen / total || 0.02 }} />
        <span className="h-1.5 rounded-full bg-bad" style={{ flex: mauvais / total || 0.02 }} />
      </div>
      <div className="mt-1.5 font-mono text-[10px] text-muted-foreground">
        {bon} · {moyen} · {mauvais}
      </div>
    </>
  );
}

function LigneEngin({
  materiel,
  actif,
  onSelect,
  onEdit,
  onDelete,
}: {
  materiel: Materiel;
  actif: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const style = ETAT_STYLE[materiel.etat];
  const meta = [materiel.capacite, materiel.annee, materiel.identifiant_complementaire]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "glass-panel rounded-lg p-3 transition hover:brightness-105",
        actif && "ring-2 ring-safety",
      )}
    >
      <button onClick={onSelect} className="flex w-full items-center gap-3 text-left">
        <div className="grid size-10 shrink-0 place-items-center rounded-md bg-steel/15 font-mono text-xs font-bold text-steel">
          {sigle(materiel.nom)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <span className="font-semibold">{materiel.nom}</span>
            {meta && <span className="font-mono text-xs text-steel">{meta}</span>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span>{materiel.emplacement || "Emplacement non renseigné"}</span>
            <span className="ml-auto font-mono text-[10px]">
              maj {formatDateCourte(materiel.date_derniere_maj)}
            </span>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
            style.badge,
          )}
        >
          <span className={cn("size-1.5 rounded-full", style.dot)} />
          {materiel.etat}
        </span>
      </button>
      <div className="mt-2 flex gap-2 border-t border-border pt-2">
        <button
          onClick={onEdit}
          className="rounded bg-background/70 px-2.5 py-1 text-xs font-medium ring-1 ring-border transition hover:bg-foreground/5"
        >
          Modifier
        </button>
        <button
          onClick={onDelete}
          className="rounded bg-background/70 px-2.5 py-1 text-xs font-medium text-bad ring-1 ring-border transition hover:bg-bad/10"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}
