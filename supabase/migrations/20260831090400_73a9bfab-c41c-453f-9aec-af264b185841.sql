CREATE TYPE public.etat_materiel AS ENUM ('Bon état', 'État moyen', 'Mauvais état');

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL UNIQUE,
  icone text NOT NULL DEFAULT 'box',
  ordre integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories accessibles a tous" ON public.categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.materiel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  categorie_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  capacite text,
  annee integer,
  identifiant_complementaire text,
  etat public.etat_materiel NOT NULL DEFAULT 'Bon état',
  emplacement text NOT NULL DEFAULT '',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  date_derniere_maj timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materiel TO anon, authenticated;
GRANT ALL ON public.materiel TO service_role;
ALTER TABLE public.materiel ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Materiel accessible a tous" ON public.materiel FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.materiel_historique (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  materiel_id uuid NOT NULL REFERENCES public.materiel(id) ON DELETE CASCADE,
  champ text NOT NULL,
  ancienne_valeur text,
  nouvelle_valeur text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.materiel_historique TO anon, authenticated;
GRANT ALL ON public.materiel_historique TO service_role;
ALTER TABLE public.materiel_historique ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Historique lisible par tous" ON public.materiel_historique FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Historique inserable par tous" ON public.materiel_historique FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX idx_materiel_categorie ON public.materiel(categorie_id);
CREATE INDEX idx_historique_materiel ON public.materiel_historique(materiel_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.materiel_track_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.date_derniere_maj = now();
  IF NEW.etat IS DISTINCT FROM OLD.etat THEN
    INSERT INTO public.materiel_historique (materiel_id, champ, ancienne_valeur, nouvelle_valeur)
    VALUES (NEW.id, 'etat', OLD.etat::text, NEW.etat::text);
  END IF;
  IF NEW.emplacement IS DISTINCT FROM OLD.emplacement THEN
    INSERT INTO public.materiel_historique (materiel_id, champ, ancienne_valeur, nouvelle_valeur)
    VALUES (NEW.id, 'emplacement', OLD.emplacement, NEW.emplacement);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER materiel_track_changes_trigger
BEFORE UPDATE ON public.materiel
FOR EACH ROW EXECUTE FUNCTION public.materiel_track_changes();

INSERT INTO public.categories (nom, icone, ordre) VALUES
  ('Grue', 'crane', 1),
  ('Camion Grue', 'truck', 2),
  ('Chariot élévateur', 'forklift', 3),
  ('Nacelle à ciseaux', 'lift', 4),
  ('Générateur', 'generator', 5),
  ('Voiture double cabine', 'car', 6);