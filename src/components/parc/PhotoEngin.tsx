import { sigle } from "@/lib/materiel";
import { cn } from "@/lib/utils";

/** Photo de l'engin, avec repli sur le sigle quand aucune image n'est enregistrée. */
export function PhotoEngin({
  src,
  nom,
  className,
}: {
  src: string | null;
  nom: string;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={`Photo de ${nom}`}
        loading="lazy"
        className={cn("shrink-0 rounded-xl object-cover ring-1 ring-border", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-xl bg-steel/10 font-mono text-xs font-bold text-steel ring-1 ring-border",
        className,
      )}
      aria-label={`Aucune photo pour ${nom}`}
    >
      {sigle(nom)}
    </div>
  );
}
