import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { compresserImage } from "@/lib/photo";
import { PhotoEngin } from "@/components/parc/PhotoEngin";

export function PhotoField({
  value,
  nom,
  onChange,
}: {
  value: string;
  nom: string;
  onChange: (v: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [chargement, setChargement] = useState(false);

  return (
    <div>
      <span className="block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        Photo
      </span>
      <div className="mt-1.5 flex items-center gap-3">
        <PhotoEngin src={value || null} nom={nom} className="size-20 rounded-xl" />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={chargement}
            onClick={() => input.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground/5 px-3 py-2 text-sm font-medium ring-1 ring-border transition hover:bg-foreground/10 disabled:opacity-60"
          >
            <ImagePlus className="size-4" />
            {chargement ? "Traitement…" : value ? "Remplacer" : "Choisir une photo"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground/5 px-3 py-2 text-sm font-medium text-bad ring-1 ring-border transition hover:bg-bad/10"
            >
              <Trash2 className="size-4" /> Retirer
            </button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setChargement(true);
          try {
            onChange(await compresserImage(file));
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Image illisible");
          } finally {
            setChargement(false);
          }
        }}
      />
    </div>
  );
}
