"use client";

import { useState } from "react";
import {
  Check,
  ChevronsUpDown,
  PlaneLanding,
  PlaneTakeoff,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

type TerminalSelectProps = {
  value?: string;
  onChange: (value: string) => void;
  landing?: boolean; // if true, show landing icon, else show takeoff icon
  placeholder?: string;
  options?: string[];
};

export function TerminalSelect({
  value,
  onChange,
  landing = false,
  placeholder = "NA",
  options = ["T2", "T3", "T4", "T5"],
}: TerminalSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        {/* Icon */}
        {!landing ? (
          <PlaneTakeoff className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none z-10 text-primary  dark:text-primaryblue" />
        ) : (
          <PlaneLanding className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none z-10 text-primary  dark:text-primaryblue" />
        )}

        {/* Trigger */}
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="pl-9 w-full h-11 rounded-full justify-between dark:border-0  border border-primary-light/10  data-[state=open]:border-primary data-[state=open]:ring-3 data-[state=open]:ring-primary/50 text-primary  dark:text-primaryblue border-primary/50 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 hover:bg-white/20 active:bg-white/20 data-[state=open]:bg-white/2 bg-transparent backdrop-blur-md"
          >
            {value || placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
      </div>

      {/* Content */}
      <PopoverContent className="w-full p-1">
        <div className="flex flex-col gap-1">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelect(opt)}
              className={`text-sm px-3 py-2 rounded-md text-left hover:bg-primary-light/10 ${
                value === opt
                  ? "bg-primary text-white hover:bg-primary font-medium"
                  : ""
              }`}
            >
              {/* <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  value === opt ? "opacity-100" : "opacity-0"
                )}
              /> */}
              {opt}
            </button>
          ))}

          <button
            type="button"
            onClick={() => handleSelect("")}
            className="px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md"
          >
            Clear selection
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
