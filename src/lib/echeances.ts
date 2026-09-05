import type { Materiel } from "@/lib/materiel";

export type TypeEvenement = "controle" | "entretien" | "assurance" | "autre";

export type StatutEcheance = "aucune" | "ok" | "proche" | "expire";

export const SEUIL_JOURS = 30;

export const TYPE_LABEL: Record<TypeEvenement, string> = {
  controle: "Contrôle technique",
  entretien: "Entretien",
  assurance: "Assurance",
  autre: "Autre événement",
};

/** Champs de la table matériel → libellé et type d'événement. */
export const CHAMP_META: Record<string, { label: string; type: TypeEvenement; date?: boolean }> = {
  date_controle_technique: { label: "Dernier contrôle technique", type: "controle", date: true },
  date_prochain_controle_technique: {
    label: "Prochain contrôle technique",
    type: "controle",
    date: true,
  },
  date_debut_assurance: { label: "Début d'assurance", type: "assurance", date: true },
  date_fin_assurance: { label: "Fin d'assurance", type: "assurance", date: true },
  date_dernier_entretien: { label: "Dernier entretien", type: "entretien", date: true },
  date_prochain_entretien: { label: "Prochain entretien", type: "entretien", date: true },
  etat: { label: "Changement d'état", type: "autre" },
  emplacement: { label: "Changement d'emplacement", type: "autre" },
  notes: { label: "Notes mises à jour", type: "autre" },
  nom: { label: "Renommage", type: "autre" },
  capacite: { label: "Capacité modifiée", type: "autre" },
};

export function metaChamp(champ: string) {
  return CHAMP_META[champ] ?? { label: champ, type: "autre" as TypeEvenement };
}

export function joursRestants(date: string | null | undefined): number | null {
  if (!date) return null;
  const cible = new Date(`${date}T00:00:00`);
  if (Number.isNaN(cible.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((cible.getTime() - today.getTime()) / 86_400_000);
}

export function statutEcheance(date: string | null | undefined): StatutEcheance {
  const j = joursRestants(date);
  if (j === null) return "aucune";
  if (j < 0) return "expire";
  if (j <= SEUIL_JOURS) return "proche";
  return "ok";
}

export const STATUT_STYLE: Record<StatutEcheance, { badge: string; dot: string; label: string }> = {
  aucune: { badge: "bg-muted text-muted-foreground", dot: "bg-muted-foreground", label: "Non renseigné" },
  ok: { badge: "bg-ok/15 text-ok", dot: "bg-ok", label: "Valide" },
  proche: { badge: "bg-warn/15 text-warn", dot: "bg-warn", label: "À venir" },
  expire: { badge: "bg-bad/15 text-bad", dot: "bg-bad", label: "Expiré" },
};

export type Echeance = {
  type: TypeEvenement;
  label: string;
  date: string | null;
  statut: StatutEcheance;
  jours: number | null;
};

/** Les trois échéances suivies pour un engin. */
export function echeances(m: Materiel): Echeance[] {
  const src: Array<[TypeEvenement, string, string | null]> = [
    ["controle", "Contrôle technique", m.date_prochain_controle_technique ?? null],
    ["assurance", "Assurance", m.date_fin_assurance ?? null],
    ["entretien", "Entretien", m.date_prochain_entretien ?? null],
  ];
  return src.map(([type, label, date]) => ({
    type,
    label,
    date,
    statut: statutEcheance(date),
    jours: joursRestants(date),
  }));
}

/** Pire statut parmi les échéances d'un engin (pour le badge de la liste). */
export function alerteMateriel(m: Materiel): Echeance | null {
  const rang: Record<StatutEcheance, number> = { expire: 3, proche: 2, ok: 1, aucune: 0 };
  const pire = echeances(m)
    .filter((e) => e.statut === "expire" || e.statut === "proche")
    .sort((a, b) => rang[b.statut] - rang[a.statut] || (a.jours ?? 0) - (b.jours ?? 0))[0];
  return pire ?? null;
}

export function formatDateFR(date: string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTimeFR(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
