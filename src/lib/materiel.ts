import {
  Car,
  ConstructionIcon,
  Forklift,
  MoveVertical,
  Truck,
  Zap,
  Boxes,
  type LucideIcon,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

export type Etat = Database["public"]["Enums"]["etat_materiel"];
export type Categorie = Database["public"]["Tables"]["categories"]["Row"];
export type Materiel = Database["public"]["Tables"]["materiel"]["Row"];
export type Historique = Database["public"]["Tables"]["materiel_historique"]["Row"];

export const ETATS: Etat[] = ["Bon état", "État moyen", "Mauvais état"];

export const ETAT_COURT: Record<Etat, string> = {
  "Bon état": "Bon",
  "État moyen": "Moyen",
  "Mauvais état": "Mauvais",
};

/** Classes de couleur (tokens du design system) par état. */
export const ETAT_STYLE: Record<Etat, { badge: string; dot: string; bar: string; text: string }> = {
  "Bon état": {
    badge: "bg-ok/15 text-ok",
    dot: "bg-ok",
    bar: "bg-ok",
    text: "text-ok",
  },
  "État moyen": {
    badge: "bg-warn/15 text-warn",
    dot: "bg-warn",
    bar: "bg-warn",
    text: "text-warn",
  },
  "Mauvais état": {
    badge: "bg-bad/15 text-bad",
    dot: "bg-bad",
    bar: "bg-bad",
    text: "text-bad",
  },
};

const ICONES: Record<string, LucideIcon> = {
  crane: ConstructionIcon,
  truck: Truck,
  forklift: Forklift,
  lift: MoveVertical,
  generator: Zap,
  car: Car,
  box: Boxes,
};

export function iconePourCategorie(icone: string | null | undefined): LucideIcon {
  return ICONES[icone ?? "box"] ?? Boxes;
}

export const ICONES_DISPONIBLES = Object.keys(ICONES);

/** Sigle deux lettres affiché dans la pastille de la ligne. */
export function sigle(nom: string): string {
  const mots = nom.trim().split(/\s+/);
  if (mots.length >= 2) return (mots[0]![0]! + mots[1]![0]!).toUpperCase();
  return nom.slice(0, 2).toUpperCase();
}

export function formatDateCourte(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export function formatHeure(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function resumeEtats(items: Materiel[]) {
  return {
    total: items.length,
    bon: items.filter((m) => m.etat === "Bon état").length,
    moyen: items.filter((m) => m.etat === "État moyen").length,
    mauvais: items.filter((m) => m.etat === "Mauvais état").length,
  };
}
