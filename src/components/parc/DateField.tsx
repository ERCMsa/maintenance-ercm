import { CalendarIcon, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateFR, statutEcheance, STATUT_STYLE } from "@/lib/echeances";
import { cn } from "@/lib/utils";

function toISO(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const j = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${j}`;
}

export function DateField({
  label,
  value,
  onChange,
  alerte = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Affiche une pastille de statut (échéance à venir / dépassée). */
  alerte?: boolean;
}) {
  const statut = statutEcheance(value || null);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;

  return (
    <div>
      <span className="block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-1.5 flex items-center gap-1.5">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex flex-1 items-center gap-2 rounded-lg bg-foreground/5 px-3 py-2 text-left text-sm ring-1 ring-border transition hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-safety",
                !value && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="size-4 shrink-0 text-steel" />
              <span className="truncate">{value ? formatDateFR(value) : "Choisir une date"}</span>
              {alerte && value && statut !== "ok" && (
                <span
                  className={cn(
                    "ml-auto rounded-full px-2 py-0.5 font-mono text-[10px]",
                    STATUT_STYLE[statut].badge,
                  )}
                >
                  {STATUT_STYLE[statut].label}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selected}
              {...(selected ? { defaultMonth: selected } : {})}
              onSelect={(d) => onChange(d ? toISO(d) : "")}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        {value && (
          <button
            type="button"
            aria-label={`Effacer ${label}`}
            onClick={() => onChange("")}
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-foreground/5 text-muted-foreground ring-1 ring-border transition hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
