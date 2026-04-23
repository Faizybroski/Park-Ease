import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Button } from "@/components/ui/button";

type Props = {
  homepage?: boolean; // if true, use white text for better contrast on hero background
};

const airports = [
  {
    value: "heathrow",
    label: "Heathrow Airport",
    subtitle: "London, United Kingdom",
  },
];

export default function AirportPopover({ homepage = false }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>("heathrow"); // preselected

  const current = airports.find((a) => a.value === selected);

  return (
    // <div className="space-y-1.5">
    //   <label className="text-sm font-medium">Select Airport</label>

    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {homepage ? (
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`w-full rounded-full justify-between border border-primary-light/10 bg-input hover:bg-input data-[state=open]:bg-input text-white h-11 sm:h-14 dark:text-white`}
          >
            {current ? (
              <div className={`flex flex-col sm:flex-row items-center justify-center gap-2 text-left leading-tight`}>
                <span className="text-primary text-sm font-medium ">
                  {current.label}
                </span>
                <span className="hidden sm:block text-xs text-muted-foreground dark:text-white">
                  {current.subtitle}
                </span>
              </div>
            ) : (
              <span className="text-primary/80">Select Airport</span>
            )}

            <ChevronDown className="ml-2 h-4 w-4 opacity-60" />
          </Button>
        ) : (
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`w-full h-11 rounded-full justify-between border border-primary-light/10 bg-input hover:bg-input data-[state=open]:bg-input ${homepage ? "text-white h-14" : "text-primary"}`}
          >
            {current ? (
              <div className={`flex flex-col text-left leading-tight`}>
                <span className="text-primary text-sm font-medium">
                  {current.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {current.subtitle}
                </span>
              </div>
            ) : (
              <span className="text-primary/80">Select Airport</span>
            )}

            <ChevronDown className="ml-2 h-4 w-4 opacity-60" />
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="p-2 w-[300px] rounded-xl shadow-lg"
      >
        <div className="flex flex-col gap-1">
          {airports.map((airport) => (
            <button
              key={airport.value}
              onClick={() => {
                setSelected(airport.value);
                setOpen(false);
              }}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-muted transition",
                selected === airport.value && "bg-muted",
              )}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{airport.label}</span>
                <span className="text-xs text-muted-foreground">
                  {airport.subtitle}
                </span>
              </div>

              {selected === airport.value && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
    // </div>
  );
}
