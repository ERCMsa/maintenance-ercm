DROP POLICY IF EXISTS "Categories accessibles a tous" ON public.categories;
DROP POLICY IF EXISTS "Materiel accessible a tous" ON public.materiel;
DROP POLICY IF EXISTS "Historique inserable par tous" ON public.materiel_historique;
DROP POLICY IF EXISTS "Historique lisible par tous" ON public.materiel_historique;
DROP POLICY IF EXISTS "Journal accessible a tous" ON public.materiel_journal;

REVOKE ALL ON public.categories, public.materiel, public.materiel_historique, public.materiel_journal FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories, public.materiel, public.materiel_journal TO authenticated;
GRANT SELECT, INSERT ON public.materiel_historique TO authenticated;
GRANT ALL ON public.categories, public.materiel, public.materiel_historique, public.materiel_journal TO service_role;

CREATE POLICY "Categories utilisateurs connectes" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Materiel utilisateurs connectes" ON public.materiel FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Historique lisible connectes" ON public.materiel_historique FOR SELECT TO authenticated USING (true);
CREATE POLICY "Historique inserable connectes" ON public.materiel_historique FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Journal utilisateurs connectes" ON public.materiel_journal FOR ALL TO authenticated USING (true) WITH CHECK (true);