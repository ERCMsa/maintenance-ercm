import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Connexion — Suivi Matériel" },
      { name: "description", content: "Connectez-vous pour accéder au suivi du parc matériel." },
      { property: "og:title", content: "Connexion — Suivi Matériel" },
      { property: "og:description", content: "Accès sécurisé au suivi du parc matériel." },
    ],
  }),
  component: AuthPage,
});

const label = "block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground";
const champ =
  "mt-1.5 w-full rounded-lg bg-foreground/5 px-3 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-safety";

function cible(r?: string) {
  return r && r.startsWith("/") && !r.startsWith("//") && !r.startsWith("/auth") ? r : "/";
}

function messageErreur(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Email ou mot de passe incorrect.";
  if (m.includes("email not confirmed")) return "Email non confirmé : vérifiez votre boîte de réception.";
  if (m.includes("already registered")) return "Un compte existe déjà avec cet email.";
  if (m.includes("password")) return "Mot de passe trop faible (8 caractères minimum).";
  if (m.includes("rate limit")) return "Trop de tentatives, réessayez dans quelques minutes.";
  return "Une erreur est survenue. Réessayez.";
}

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: cible(redirect), replace: true });
    });
  }, [navigate, redirect]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErreur(null);
    const parsed = z
      .object({ email: z.string().trim().email(), password: z.string().min(mode === "signup" ? 8 : 1) })
      .safeParse({ email, password });
    if (!parsed.success) {
      setErreur(mode === "signup" ? "Email valide et mot de passe de 8 caractères minimum requis." : "Email valide et mot de passe requis.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        navigate({ to: cible(redirect), replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/", replace: true });
        else {
          toast.success("Compte créé : confirmez votre email pour vous connecter.");
          setMode("login");
        }
      }
    } catch (err) {
      setErreur(messageErreur(err instanceof Error ? err.message : ""));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center px-4">
      <div className="atelier-haze pointer-events-none fixed inset-0" />
      <form onSubmit={submit} className="glass-panel animate-rise relative w-full max-w-sm space-y-4 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <img src="/logo-single.png" alt="Logo" className="h-10" />
          <div>
            <h1 className="font-display text-xl tracking-wide">SUIVI MATÉRIEL</h1>
            <p className="text-xs text-muted-foreground">
              {mode === "login" ? "Connectez-vous pour continuer" : "Créer un compte"}
            </p>
          </div>
        </div>
        <div>
          <label className={label} htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" className={champ} value={email} maxLength={255} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="pwd">Mot de passe</label>
          <input id="pwd" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} className={champ} value={password} maxLength={128} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {erreur && <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{erreur}</p>}
        <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-safety py-2.5 text-sm font-semibold text-safety-foreground transition hover:brightness-110 disabled:opacity-60">
          {busy && <Loader2 className="size-4 animate-spin" />}
          {mode === "login" ? "Se connecter" : "Créer le compte"}
        </button>
        <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErreur(null); }} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
          {mode === "login" ? "Pas de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
        </button>
      </form>
    </div>
  );
}
