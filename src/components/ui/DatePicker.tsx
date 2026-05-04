"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Props = {
  value?: string;
  onChange: (value: string) => void;
  homepage?: boolean; // if true, use white text for better contrast on hero background
};

const HOURS = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0"),
);
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  i.toString().padStart(2, "0"),
);

function TimeColumn({
  items,
  selected,
  onSelect,
}: {
  items: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const idx = items.indexOf(selected);
    if (idx !== -1 && containerRef.current) {
      const item = containerRef.current.children[idx] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
  }, [selected, items]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col overflow-y-auto h-56 w-14 scrollbar-thin"
    >
      {items.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onSelect(v)}
          className={`text-sm px-3 py-2 rounded-md text-left hover:bg-muted dark:text-primary dark:hover:bg-background ${
            selected === v
              ? "bg-primary text-white hover:bg-primary font-medium dark:text-white "
              : ""
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

const generateTimeSlots = () => {
  const slots: string[] = [];

  for (let hour = 0; hour < 24; hour++) {
    const h = hour.toString().padStart(2, "0");
    slots.push(`${h}:00`);
  }

  return slots;
};

export function DateTimePicker({ value, onChange, homepage = false }: Props) {
  const [open, setOpen] = useState(false);
  const parsed = value ? new Date(value) : undefined;

  const [date, setDate] = useState<Date | undefined>(parsed);
  // const [time, setTime] = useState(
  //   parsed
  //     ? `${parsed.getHours().toString().padStart(2, "0")}:${parsed
  //         .getMinutes()
  //         .toString()
  //         .padStart(2, "0")}`
  //     : "",
  // );
  const [time, setTime] = useState(
    parsed ? `${parsed.getHours().toString().padStart(2, "0")}:00` : "",
  );

  const [hour, setHour] = useState(
    parsed ? parsed.getHours().toString().padStart(2, "0") : "00",
  );
  const [minute, setMinute] = useState(
    parsed ? parsed.getMinutes().toString().padStart(2, "0") : "00",
  );

  const update = (d?: Date, t?: string) => {
    if (!d && !date) return;

    const finalDate = new Date(d || date!);
    // const [h, m] = (t || time || "00:00").split(":");

    // finalDate.setHours(Number(h));
    // finalDate.setMinutes(Number(m));
    const [h] = (t || time || "00:00").split(":");

    finalDate.setHours(Number(h));
    finalDate.setMinutes(0);
    finalDate.setSeconds(0);
    finalDate.setMilliseconds(0);

    onChange(finalDate.toISOString());
  };

  const commit = (d: Date | undefined, h: string, m: string) => {
    if (!d) return;
    const finalDate = new Date(d);
    finalDate.setHours(Number(h));
    finalDate.setMinutes(Number(m));
    finalDate.setSeconds(0);
    finalDate.setMilliseconds(0);
    onChange(finalDate.toISOString());
  };

  const handleHourSelect = (h: string) => {
    setHour(h);
    commit(date, h, minute);
  };

  const handleMinuteSelect = (m: string) => {
    setMinute(m);
    commit(date, hour, m);
    if (date) setOpen(false);
  };

  const handleDateSelect = (d: Date | undefined) => {
    setDate(d);
    commit(d, hour, minute);
  };

  const displayTime = `${hour}:${minute}`;

  const timeSlots = generateTimeSlots();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* SINGLE TRIGGER */}
      <PopoverTrigger
        asChild
        className={` ${homepage ? " active:bg-white bg-white" : "active:bg-white/20"}`}
      >
        <Button
          variant="outline"
          className={`w-full h-11 rounded-full justify-start text-left font-normal border border-primary/50 dark:border-0 bg-transparent backdrop-blur-md  ${homepage ? "bg-white dark:bg-white border-0 h-14" : "hover:bg-white/20 active:bg-white/20 data-[state=open]:bg-white/2"}`}
        >
          <CalendarIcon
            className={`mr-2 h-4 w-4  ${homepage ? "text-muted-foreground dark:text-primary" : "text-primary  dark:text-primaryblue"}`}
          />

          {date ? (
            <>
              <span
                className={` ${homepage ? "text-primary" : "text-primary dark:text-primaryblue"}`}
              >
                {format(date, "PPP")}
              </span>
              <span
                className={`mx-2   ${homepage ? "text-primary" : "text-primary  dark:text-primaryblue"}`}
              >
                •
              </span>
              {/* <Clock className={`mr-1 h-4 w-4 text-white`} /> */}
              <span
                className={` ${homepage ? "text-primary" : "text-primary  dark:text-primaryblue"}`}
              >
                {displayTime}
              </span>
            </>
          ) : (
            <span
              className={`${homepage ? "text-muted-foreground dark:text-primary/50" : "text-ring dark:text-muted-foreground"}`}
            >
              Pick date & time
            </span>
          )}
        </Button>
      </PopoverTrigger>

      {/* COMBINED PANEL */}
      <PopoverContent
        align="start"
        className="p-0 rounded-xl shadow-lg w-auto bg-white"
      >
        <div className="flex">
          {/* Calendar */}
          <div className="border-r p-2">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                setDate(d);
                update(d, undefined);
              }}
              disabled={{ before: new Date() }}
              initialFocus
            />
          </div>

          {/* Time list */}
          {/* <div className="p-3  max-h-72 overflow-y-auto no-scrollbar"> */}
          <div className="p-3 flex flex-col gap-2">

            <p className="text-sm text-primary font-medium mb-2">Select time</p>

            {/* <div className="flex flex-col gap-1">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => {
                    setTime(slot);
                    update(undefined, slot);
                    setOpen(false);
                  }}
                  className={`text-sm px-3 py-2 rounded-md text-left hover:bg-muted dark:text-primary dark:hover:bg-background ${
                    time === slot
                      ? "bg-primary text-white hover:bg-primary font-medium dark:text-white "
                      : "dark:hover:bg-primary/20"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div> */}
            <div className="flex gap-1">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">HH</span>
                <TimeColumn
                  items={HOURS}
                  selected={hour}
                  onSelect={handleHourSelect}
                />
              </div>
              <div className="flex items-center justify-center pt-5 text-primary font-semibold">
                :
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">MM</span>
                <TimeColumn
                  items={MINUTES}
                  selected={minute}
                  onSelect={handleMinuteSelect}
                />
              </div>
            </div>
            <p className="text-center text-sm font-medium text-primary">
              {displayTime}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
