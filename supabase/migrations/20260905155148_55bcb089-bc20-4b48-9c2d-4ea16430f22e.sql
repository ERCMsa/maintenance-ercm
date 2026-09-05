ALTER TABLE public.materiel
  ADD COLUMN IF NOT EXISTS date_controle_technique date,
  ADD COLUMN IF NOT EXISTS date_prochain_controle_technique date,
  ADD COLUMN IF NOT EXISTS date_debut_assurance date,
  ADD COLUMN IF NOT EXISTS date_fin_assurance date,
  ADD COLUMN IF NOT EXISTS date_dernier_entretien date,
  ADD COLUMN IF NOT EXISTS date_prochain_entretien date;

CREATE OR REPLACE FUNCTION public.materiel_track_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  champs text[] := ARRAY[
    'etat','emplacement','notes','nom','capacite',
    'date_controle_technique','date_prochain_controle_technique',
    'date_debut_assurance','date_fin_assurance',
    'date_dernier_entretien','date_prochain_entretien'
  ];
  c text;
  old_v text;
  new_v text;
  old_j jsonb := to_jsonb(OLD);
  new_j jsonb := to_jsonb(NEW);
BEGIN
  NEW.date_derniere_maj = now();
  FOREACH c IN ARRAY champs LOOP
    old_v := old_j ->> c;
    new_v := new_j ->> c;
    IF new_v IS DISTINCT FROM old_v THEN
      INSERT INTO public.materiel_historique (materiel_id, champ, ancienne_valeur, nouvelle_valeur)
      VALUES (NEW.id, c, old_v, new_v);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$function$;