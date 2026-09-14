import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Printer, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/parc/AppShell";
import { MaterielDialog } from "@/components/parc/MaterielDialog";
import { PhotoEngin } from "@/components/parc/PhotoEngin";
import { JournalSection, totalHeures, useJournal } from "@/components/parc/JournalSection";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ETAT_STYLE,
  iconePourCategorie,
  type Categorie,
  type Historique,
  type Materiel,
} from "@/lib/materiel";
import {
  alerteMateriel,
  echeances,
  formatDateFR,
  formatDateTimeFR,
  metaChamp,
  STATUT_STYLE,
  statutEcheance,
  TYPE_LABEL,
  type TypeEvenement,
} from "@/lib/echeances";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/materiel/$id")({
  head: () => ({
    meta: [
      { title: "Fiche matériel — Parc Matériel" },
      {
        name: "description",
        content:
          "Fiche détaillée d'un engin : informations générales, échéances de contrôle technique, d'assurance et d'entretien, et historique complet.",
      },
      { property: "og:title", content: "Fiche matériel — Parc Matériel" },
      {
        property: "og:description",
        content: "Informations, échéances et historique complet d'un engin du parc.",
      },
    ],
  }),
  component: FichePage,
});

const ONGLETS: Array<{ value: "tous" | TypeEvenement; label: string }> = [
  { value: "tous", label: "Tous" },
  { value: "controle", label: "Contrôle technique" },
  { value: "entretien", label: "Entretien" },
  { value: "assurance", label: "Assurance" },
  { value: "autre", label: "Autres" },
];

function FichePage() {
  const { id } = Route.useParams();
  const [edition, setEdition] = useState(false);

  const materiel = useQuery({
    queryKey: ["materiel", id],
    queryFn: async (): Promise<Materiel | null> => {
      const { data, error } = await supabase.from("materiel").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Categorie[]> => {
      const { data, error } = await supabase.from("categories").select("*").order("ordre");
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const historique = useQuery({
    queryKey: ["historique", id],
    queryFn: async (): Promise<Historique[]> => {
      const { data, error } = await supabase
        .from("materiel_historique")
        .select("*")
        .eq("materiel_id", id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const journal = useJournal(id);

  const m = materiel.data ?? null;
  const cats = categories.data ?? [];
  const categorie = cats.find((c) => c.id === m?.categorie_id);

  const evenements = useMemo(() => {
    const lignes = (historique.data ?? []).map((h) => {
      const meta = metaChamp(h.champ);
      return { ...h, ...meta };
    });
    if (m) {
      lignes.push({
        id: `creation-${m.id}`,
        materiel_id: m.id,
        champ: "creation",
        ancienne_valeur: null,
        nouvelle_valeur: null,
        created_at: m.created_at,
        label: "Création de la fiche",
        type: "autre" as TypeEvenement,
      });
    }
    return lignes.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [historique.data, m]);

  const alerte = m ? alerteMateriel(m) : null;

  return (
    <AppShell
      actions={
        m ? (
          <>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground/5 px-3.5 py-2 text-sm font-medium ring-1 ring-border transition hover:bg-foreground/10"
            >
              <Printer className="size-4" /> Imprimer la fiche
            </button>
            <button
              onClick={() => setEdition(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-safety px-3.5 py-2 text-sm font-semibold text-safety-foreground transition hover:brightness-110"
            >
              <Pencil className="size-4" /> Modifier
            </button>
          </>
        ) : null
      }
    >
      <Link
        to="/"
        className="no-print inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Retour au parc
      </Link>

      {materiel.isLoading && (
        <p className="font-mono text-xs text-muted-foreground">Chargement de la fiche…</p>
      )}

      {!materiel.isLoading && !m && (
        <div className="glass-panel rounded-xl p-6 text-center text-sm text-muted-foreground">
          Cet engin n'existe plus.
        </div>
      )}

      {m && (
        <>
          <section className="glass-panel animate-rise rounded-2xl p-4 sm:p-5">
            <div className="flex flex-wrap items-start gap-4">
              <PhotoEngin
                src={m.photo_url}
                nom={m.nom}
                className="size-28 rounded-2xl sm:size-32"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl tracking-wide sm:text-3xl">{m.nom}</h1>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                      ETAT_STYLE[m.etat].badge,
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full", ETAT_STYLE[m.etat].dot)} />
                    {m.etat}
                  </span>
                  {alerte && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                        STATUT_STYLE[alerte.statut].badge,
                      )}
                    >
                      <TriangleAlert className="size-3.5" />
                      {alerte.label} {alerte.statut === "expire" ? "expiré" : "bientôt échu"}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
                  {categorie && (
                    <span className="inline-flex items-center gap-1.5">
                      {(() => {
                        const Icone = iconePourCategorie(categorie.icone);
                        return <Icone className="size-3.5 text-steel" />;
                      })()}
                      {categorie.nom}
                    </span>
                  )}
                  {m.capacite && <span>{m.capacite}</span>}
                  {m.annee && <span>{m.annee}</span>}
                  {m.identifiant_complementaire && <span>{m.identifiant_complementaire}</span>}
                </div>
              </div>
            </div>

            <dl className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Conducteur actuel" valeur={m.conducteur || "Non renseigné"} />
              <Info label="Emplacement" valeur={m.emplacement || "Non renseigné"} />
              <Info label="Date de mise en place" valeur={formatDateFR(m.date_mise_en_place)} />
              <Info
                label="Heures cumulées"
                valeur={`${totalHeures(journal.data ?? []).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} h`}
              />
              <Info label="Mise en service" valeur={m.annee ? String(m.annee) : "—"} />
              <Info label="Fiche créée le" valeur={formatDateTimeFR(m.created_at)} />
              <Info label="Dernière mise à jour" valeur={formatDateTimeFR(m.date_derniere_maj)} />
            </dl>

            {m.notes && (
              <p className="mt-4 rounded-xl panel-2 p-3 text-sm text-muted-foreground">{m.notes}</p>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            {echeances(m).map((e) => (
              <div key={e.type} className="glass-panel animate-rise rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {e.label}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      STATUT_STYLE[e.statut].badge,
                    )}
                  >
                    {STATUT_STYLE[e.statut].label}
                  </span>
                </div>
                <div className="mt-2 font-display text-xl tracking-wide">{formatDateFR(e.date)}</div>
                <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {e.jours === null
                    ? "Aucune échéance enregistrée"
                    : e.jours < 0
                      ? `Dépassé de ${Math.abs(e.jours)} j`
                      : `Dans ${e.jours} j`}
                </div>
                <div className="mt-3 space-y-1 border-t border-border pt-2 font-mono text-[11px] text-muted-foreground">
                  {e.type === "controle" && (
                    <div>Dernier contrôle : {formatDateFR(m.date_controle_technique)}</div>
                  )}
                  {e.type === "assurance" && (
                    <div>Début : {formatDateFR(m.date_debut_assurance)}</div>
                  )}
                  {e.type === "entretien" && (
                    <div>Dernier entretien : {formatDateFR(m.date_dernier_entretien)}</div>
                  )}
                </div>
              </div>
            ))}
          </section>

          <JournalSection materiel={m} />

          <section className="glass-panel animate-rise rounded-2xl p-4 sm:p-5">
            <h2 className="font-display text-lg tracking-wide">Historique complet</h2>
            <Tabs defaultValue="tous" className="mt-3">
              <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
                {ONGLETS.map((o) => (
                  <TabsTrigger
                    key={o.value}
                    value={o.value}
                    className="rounded-lg bg-foreground/5 px-3 py-1.5 text-xs data-[state=active]:bg-safety data-[state=active]:text-safety-foreground"
                  >
                    {o.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {ONGLETS.map((o) => {
                const items =
                  o.value === "tous" ? evenements : evenements.filter((e) => e.type === o.value);
                return (
                  <TabsContent key={o.value} value={o.value} className="mt-4">
                    {items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Aucun événement enregistré pour ce filtre.
                      </p>
                    ) : (
                      <ol className="relative space-y-3 border-l border-border pl-5">
                        {items.map((e) => {
                          const meta = metaChamp(e.champ);
                          const statut = meta.date
                            ? statutEcheance(e.nouvelle_valeur)
                            : ("aucune" as const);
                          return (
                            <li key={e.id} className="relative">
                              <span
                                className={cn(
                                  "absolute -left-[26px] top-2 size-2.5 rounded-full ring-4 ring-background",
                                  STATUT_STYLE[statut].dot,
                                )}
                              />
                              <div className="rounded-xl panel-2 p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-foreground/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-steel">
                                    {TYPE_LABEL[e.type]}
                                  </span>
                                  <span className="text-sm font-semibold">{e.label}</span>
                                  {meta.date && e.nouvelle_valeur && (
                                    <span
                                      className={cn(
                                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                        STATUT_STYLE[statut].badge,
                                      )}
                                    >
                                      {STATUT_STYLE[statut].label}
                                    </span>
                                  )}
                                  <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                                    {formatDateTimeFR(e.created_at)}
                                  </span>
                                </div>
                                {(e.ancienne_valeur || e.nouvelle_valeur) && (
                                  <p className="mt-1.5 text-sm text-muted-foreground">
                                    {meta.date ? (
                                      <>
                                        {formatDateFR(e.ancienne_valeur)} →{" "}
                                        <span className="text-foreground">
                                          {formatDateFR(e.nouvelle_valeur)}
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        {e.ancienne_valeur || "—"} →{" "}
                                        <span className="text-foreground">
                                          {e.nouvelle_valeur || "—"}
                                        </span>
                                      </>
                                    )}
                                  </p>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </section>

          <MaterielDialog
            open={edition}
            onOpenChange={setEdition}
            categories={cats}
            materiel={m}
          />
        </>
      )}
    </AppShell>
  );
}

function Info({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm">{valeur}</dd>
    </div>
  );
}
