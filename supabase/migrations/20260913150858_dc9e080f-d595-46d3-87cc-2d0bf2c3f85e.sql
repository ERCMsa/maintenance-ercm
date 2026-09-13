ALTER TABLE public.materiel
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS conducteur text,
  ADD COLUMN IF NOT EXISTS date_mise_en_place date;

CREATE TABLE IF NOT EXISTS public.materiel_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  materiel_id uuid NOT NULL REFERENCES public.materiel(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT current_date,
  emplacement text NOT NULL DEFAULT '',
  etat public.etat_materiel NOT NULL DEFAULT 'Bon état',
  etat_notes text,
  heures numeric(7,1) NOT NULL DEFAULT 0,
  conducteur text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS materiel_journal_materiel_date_idx ON public.materiel_journal (materiel_id, date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.materiel_journal TO anon, authenticated;
GRANT ALL ON public.materiel_journal TO service_role;

ALTER TABLE public.materiel_journal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Journal accessible a tous" ON public.materiel_journal;
CREATE POLICY "Journal accessible a tous" ON public.materiel_journal FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.materiel_track_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  champs text[] := ARRAY[
    'nom','capacite','etat','emplacement','notes','conducteur','date_mise_en_place',
    'date_controle_technique','date_prochain_controle_technique',
    'date_debut_assurance','date_fin_assurance',
    'date_dernier_entretien','date_prochain_entretien'
  ];
  c text;
  ancienne text;
  nouvelle text;
BEGIN
  NEW.date_derniere_maj := now();
  FOREACH c IN ARRAY champs LOOP
    EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', c, c)
      INTO ancienne, nouvelle USING OLD, NEW;
    IF ancienne IS DISTINCT FROM nouvelle THEN
      INSERT INTO public.materiel_historique (materiel_id, champ, ancienne_valeur, nouvelle_valeur)
      VALUES (NEW.id, c, ancienne, nouvelle);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;