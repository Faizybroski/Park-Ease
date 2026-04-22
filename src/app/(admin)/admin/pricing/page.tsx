"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { BusinessTier } from "@/types";
import {
  BadgeDollarSign,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Info,
  Layers,
  Plus,
  Save,
  Star,
  SplitSquareHorizontal,
  Tag,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_FIRST_TEN: number[] = [
  45.99, 50.99, 55.99, 58.99, 61.99, 67.99, 72.99, 77.99, 82.99, 87.99,
];
const DEFAULT_TIER2_INCREMENT = 3;
const DEFAULT_TIER3_INCREMENT = 2;
const PREVIEW_DAYS = [1, 2, 3, 5, 7, 10, 11, 15, 20, 25, 30, 31, 40, 60, 90];

// Rotating color palettes for tier cards (cycles as more tiers are added)
const CARD_PALETTES = [
  { header: "bg-blue-600", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500", ring: "ring-blue-200" },
  { header: "bg-violet-600", badge: "bg-violet-100 text-violet-700", dot: "bg-violet-500", ring: "ring-violet-200" },
  { header: "bg-emerald-600", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  { header: "bg-amber-500", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500", ring: "ring-amber-200" },
  { header: "bg-rose-600", badge: "bg-rose-100 text-rose-700", dot: "bg-rose-500", ring: "ring-rose-200" },
];

// Pricing tier band colors (used in the editor preview)
const BAND_COLORS = {
  1: { badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  2: { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  3: { badge: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
} as const;

// ── Pure helpers ─────────────────────────────────────────────────────────────

function calcPrice(day: number, prices: number[], t2Inc: number, t3Inc: number): number {
  if (day <= 0) return 0;
  if (day <= 10) return prices[day - 1] ?? 0;
  const day10 = prices[9] ?? 0;
  if (day <= 30) return day10 + (day - 10) * t2Inc;
  return day10 + 20 * t2Inc + (day - 30) * t3Inc;
}

function getBand(day: number): 1 | 2 | 3 {
  if (day <= 10) return 1;
  if (day <= 30) return 2;
  return 3;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// ── Reusable micro-components ────────────────────────────────────────────────

function PriceInput({
  value,
  onChange,
  min = 0,
  step = 0.01,
  prefix = "£",
  className = "",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
  prefix?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center rounded-xl border overflow-hidden ${className}`}
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <span
        className="px-3 py-2 text-sm font-semibold select-none"
        style={{
          color: "var(--muted-foreground)",
          borderRight: "1px solid var(--border)",
          background: "var(--muted)",
        }}
      >
        {prefix}
      </span>
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        aria-label={`Price input (${prefix})`}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(Math.max(min, v));
        }}
        className="flex-1 min-w-0 px-3 py-2 text-sm bg-transparent outline-none"
        style={{ color: "var(--foreground)" }}
      />
    </div>
  );
}

function SummaryRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="flex items-center justify-between rounded-lg px-4 py-3"
      style={{ background: "var(--muted)" }}
    >
      <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </span>
      <div className="text-right">
        <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
          {value}
        </span>
        {sub && (
          <span className="ml-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-1 my-2">
      <div className="h-px flex-1" style={{ background: "var(--border)" }} />
      <div
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full"
        style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
      >
        <ChevronDown className="h-3 w-3" />
        {label}
      </div>
      <div className="h-px flex-1" style={{ background: "var(--border)" }} />
    </div>
  );
}

// ── Pricing editor (shared between "edit tier" and "business pricing" tabs) ──

interface PricingEditorProps {
  prices: number[];
  tier2Inc: number;
  tier3Inc: number;
  onPriceChange: (index: number, value: number) => void;
  onTier2Change: (v: number) => void;
  onTier3Change: (v: number) => void;
}

function PricingEditor({
  prices,
  tier2Inc,
  tier3Inc,
  onPriceChange,
  onTier2Change,
  onTier3Change,
}: PricingEditorProps) {
  const [calcDays, setCalcDays] = useState(15);
  const calcRef = useRef<HTMLInputElement>(null);

  const day10Price = prices[9] ?? 0;
  const day11Price = day10Price + tier2Inc;
  const day30Price = day10Price + 20 * tier2Inc;
  const day31Price = day30Price + tier3Inc;
  const calcResult = calcPrice(calcDays, prices, tier2Inc, tier3Inc);

  return (
    <div className="space-y-6">
      {/* Band legend */}
      <div className="flex flex-wrap gap-2">
        {([
          { band: 1, label: "Band 1 · Days 1–10" },
          { band: 2, label: "Band 2 · Days 11–30" },
          { band: 3, label: "Band 3 · Day 31+" },
        ] as const).map(({ band, label }) => (
          <span
            key={band}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${BAND_COLORS[band].badge}`}
          >
            <span className={`h-2 w-2 rounded-full ${BAND_COLORS[band].dot}`} />
            {label}
          </span>
        ))}
      </div>

      {/* ── Band 1: Days 1–10 ── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100">
            <BadgeDollarSign className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                Days 1–10: Individual Prices
              </h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BAND_COLORS[1].badge}`}>
                Band 1
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Set the exact total price for each of the first 10 days.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {prices.slice(0, 10).map((price, i) => (
            <div key={i} className="space-y-1.5">
              <label
                className="flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: "var(--muted-foreground)" }}
              >
                <span
                  className={`h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${BAND_COLORS[1].badge}`}
                >
                  {i + 1}
                </span>
                Day {i + 1}
              </label>
              <PriceInput value={price} onChange={(v) => onPriceChange(i, v)} />
            </div>
          ))}
        </div>

        <div
          className="mt-4 flex items-center justify-between rounded-xl px-4 py-3 border"
          style={{ background: "var(--muted)", borderColor: "var(--border)" }}
        >
          <div
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ChevronRight className="h-4 w-4" />
            Day 10 price (Band 2 base)
          </div>
          <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
            {formatPrice(day10Price)}
          </span>
        </div>
      </div>

      <FlowArrow label="Band 2 continues from Day 10" />

      {/* ── Band 2: Days 11–30 ── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <Layers className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                Days 11–30: Incremental Pricing
              </h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BAND_COLORS[2].badge}`}>
                Band 2
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Day 10 price + (N − 10) × daily increment
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
              Daily increment
            </label>
            <PriceInput value={tier2Inc} onChange={onTier2Change} min={0} step={0.01} prefix="+" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
              Preview
            </p>
            <div className="space-y-1.5">
              <SummaryRow
                label="Day 11"
                value={formatPrice(day11Price)}
                sub={`${formatPrice(day10Price)} + ${formatPrice(tier2Inc)}`}
              />
              <SummaryRow label="Day 20" value={formatPrice(day10Price + 10 * tier2Inc)} />
              <SummaryRow
                label="Day 30"
                value={formatPrice(day30Price)}
                sub={`${formatPrice(day10Price)} + 20×${formatPrice(tier2Inc)}`}
              />
            </div>
          </div>
        </div>
      </div>

      <FlowArrow label="Band 3 continues from Day 30" />

      {/* ── Band 3: Day 31+ ── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100">
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                Day 31+: Long-Stay Pricing
              </h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BAND_COLORS[3].badge}`}>
                Band 3
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Day 30 price + (N − 30) × daily increment
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
              Daily increment
            </label>
            <PriceInput value={tier3Inc} onChange={onTier3Change} min={0} step={0.01} prefix="+" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
              Preview
            </p>
            <div className="space-y-1.5">
              <SummaryRow
                label="Day 31"
                value={formatPrice(day31Price)}
                sub={`${formatPrice(day30Price)} + ${formatPrice(tier3Inc)}`}
              />
              <SummaryRow label="Day 40" value={formatPrice(day30Price + 10 * tier3Inc)} />
              <SummaryRow label="Day 60" value={formatPrice(day30Price + 30 * tier3Inc)} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Price calculator ── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
            <Calculator className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              Price Calculator
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Enter any number of days to see the total price.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div
            className="flex items-center rounded-xl border overflow-hidden"
            style={{ background: "var(--muted)", borderColor: "var(--border)" }}
          >
            <span
              className="px-3 py-2.5 text-sm font-semibold"
              style={{
                color: "var(--muted-foreground)",
                borderRight: "1px solid var(--border)",
                background: "var(--muted)",
              }}
            >
              Days
            </span>
            <input
              ref={calcRef}
              type="number"
              min={1}
              step={1}
              value={calcDays}
              title="Number of days"
              aria-label="Number of days"
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 1) setCalcDays(v);
              }}
              className="w-20 px-3 py-2.5 text-sm bg-transparent outline-none font-medium"
              style={{ color: "var(--foreground)" }}
            />
          </div>
          <span style={{ color: "var(--muted-foreground)" }}>→</span>
          <div
            className="flex items-center gap-3 rounded-xl border px-4 py-3"
            style={{ background: "var(--muted)", borderColor: "var(--border)" }}
          >
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                Total for {calcDays} day{calcDays !== 1 ? "s" : ""}
              </p>
              <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                {formatPrice(calcResult)}
              </p>
            </div>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${BAND_COLORS[getBand(calcDays)].badge}`}
            >
              Band {getBand(calcDays)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Price schedule ── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <BadgeDollarSign className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              Price Schedule
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Live preview of pricing at key milestones.
            </p>
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div
            className="grid grid-cols-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
            style={{
              background: "var(--muted)",
              color: "var(--muted-foreground)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span>Duration</span>
            <span className="text-center">Band</span>
            <span className="text-right">Total Price</span>
          </div>

          {PREVIEW_DAYS.map((day, idx) => {
            const band = getBand(day);
            const price = calcPrice(day, prices, tier2Inc, tier3Inc);
            const colors = BAND_COLORS[band];
            return (
              <div
                key={day}
                className={`grid grid-cols-3 px-4 py-3 items-center${idx > 0 ? " border-t" : ""}`}
                style={{
                  borderColor: "var(--border)",
                  background: idx % 2 === 0 ? "var(--card)" : "var(--muted)",
                }}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${colors.dot}`} />
                  <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    {day} day{day !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="text-center">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
                    Band {band}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                    {formatPrice(price)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Features editor ──────────────────────────────────────────────────────────

function FeaturesEditor({
  features,
  onChange,
}: {
  features: string[];
  onChange: (f: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = () => {
    const trimmed = draft.trim();
    if (!trimmed || features.includes(trimmed)) return;
    onChange([...features, trimmed]);
    setDraft("");
    inputRef.current?.focus();
  };

  const remove = (i: number) => onChange(features.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="e.g. Free cancellation, Meet & greet service…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none bg-transparent"
          style={{
            borderColor: "var(--border)",
            color: "var(--foreground)",
            background: "var(--card)",
          }}
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-40"
          style={{
            borderColor: "var(--border)",
            color: "var(--foreground)",
            background: "var(--muted)",
          }}
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {features.length === 0 ? (
        <p className="text-sm italic" style={{ color: "var(--muted-foreground)" }}>
          No features added yet. Type one above and press Enter or Add.
        </p>
      ) : (
        <ul className="space-y-2">
          {features.map((f, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5"
              style={{ borderColor: "var(--border)", background: "var(--muted)" }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-sm truncate" style={{ color: "var(--foreground)" }}>
                  {f}
                </span>
              </div>
              <button
                type="button"
                title="Remove feature"
                aria-label="Remove feature"
                onClick={() => remove(i)}
                className="shrink-0 rounded-lg p-1 transition-colors hover:bg-red-100 hover:text-red-600"
                style={{ color: "var(--muted-foreground)" }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Tier card (summary view) ─────────────────────────────────────────────────

function TierCard({
  tier,
  palette,
  onEdit,
  onDelete,
  deleting,
}: {
  tier: BusinessTier;
  palette: (typeof CARD_PALETTES)[0];
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const day10 = tier.firstTenDayPrices[9] ?? 0;
  const day30 = day10 + 20 * tier.day11To30Increment;

  return (
    <div
      className={`rounded-2xl border overflow-hidden ring-1 ${palette.ring}`}
      style={{ borderColor: "var(--border)", background: "var(--card)" }}
    >
      {/* Header */}
      <div className={`${palette.header} px-5 py-4`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">{tier.name}</h3>
            {tier.description && (
              <p className="text-xs mt-0.5 text-white/75">{tier.description}</p>
            )}
          </div>
          <span
            className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
              tier.isActive
                ? "bg-white/20 text-white"
                : "bg-white/10 text-white/60"
            }`}
          >
            {tier.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Features */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{ color: "var(--muted-foreground)" }}>
          Features
        </p>
        {tier.features.length === 0 ? (
          <p className="text-xs italic" style={{ color: "var(--muted-foreground)" }}>
            No features listed.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {tier.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-500" />
                <span className="text-xs" style={{ color: "var(--foreground)" }}>
                  {f}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pricing summary */}
      <div className="px-5 pt-3 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{ color: "var(--muted-foreground)" }}>
          Pricing
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: "var(--muted-foreground)" }}>Day 1</span>
            <span className="font-semibold" style={{ color: "var(--foreground)" }}>
              {formatPrice(tier.firstTenDayPrices[0] ?? 0)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: "var(--muted-foreground)" }}>Day 10</span>
            <span className="font-semibold" style={{ color: "var(--foreground)" }}>
              {formatPrice(day10)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: "var(--muted-foreground)" }}>Days 11–30</span>
            <span className="font-semibold" style={{ color: "var(--foreground)" }}>
              +{formatPrice(tier.day11To30Increment)}/day
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: "var(--muted-foreground)" }}>Day 31+</span>
            <span className="font-semibold" style={{ color: "var(--foreground)" }}>
              +{formatPrice(tier.day31PlusIncrement)}/day
            </span>
          </div>
          <div
            className="mt-2 flex items-center justify-between rounded-lg px-3 py-2"
            style={{ background: "var(--muted)" }}
          >
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              30-day total
            </span>
            <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              {formatPrice(day30)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-2 px-5 py-3 border-t"
        style={{ borderColor: "var(--border)", background: "var(--muted)" }}
      >
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-colors hover:opacity-80"
          style={{
            borderColor: "var(--border)",
            color: "var(--foreground)",
            background: "var(--card)",
          }}
        >
          Edit Tier
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-600 disabled:opacity-40"
          style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", background: "var(--card)" }}
        >
          {deleting ? (
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

// ── Tier editor form ─────────────────────────────────────────────────────────

interface TierFormState {
  name: string;
  description: string;
  features: string[];
  prices: number[];
  tier2Inc: number;
  tier3Inc: number;
  isActive: boolean;
}

function emptyForm(): TierFormState {
  return {
    name: "",
    description: "",
    features: [],
    prices: [...DEFAULT_FIRST_TEN],
    tier2Inc: DEFAULT_TIER2_INCREMENT,
    tier3Inc: DEFAULT_TIER3_INCREMENT,
    isActive: true,
  };
}

function tierToForm(t: BusinessTier): TierFormState {
  return {
    name: t.name,
    description: t.description ?? "",
    features: [...t.features],
    prices: [...t.firstTenDayPrices],
    tier2Inc: t.day11To30Increment,
    tier3Inc: t.day31PlusIncrement,
    isActive: t.isActive,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════════════════════════

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<"tiers" | "compare" | "default">("tiers");

  // ── Tiers state ──
  const [tiers, setTiers] = useState<BusinessTier[]>([]);
  const [tiersLoading, setTiersLoading] = useState(true);
  const [tiersError, setTiersError] = useState("");

  // null = list view, "new" = creating, string = editing existing tier id
  const [editingId, setEditingId] = useState<null | "new" | string>(null);
  const [form, setForm] = useState<TierFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Default pricing state ──
  const [defLoading, setDefLoading] = useState(true);
  const [defPrices, setDefPrices] = useState<number[]>([...DEFAULT_FIRST_TEN]);
  const [defTier2, setDefTier2] = useState(DEFAULT_TIER2_INCREMENT);
  const [defTier3, setDefTier3] = useState(DEFAULT_TIER3_INCREMENT);
  const [defSaving, setDefSaving] = useState(false);
  const [defSuccess, setDefSuccess] = useState(false);
  const [defError, setDefError] = useState("");

  // ── Load tiers ──
  useEffect(() => {
    void (async () => {
      try {
        const res = await api.getTiers();
        setTiers(res.data);
      } catch {
        setTiersError("Failed to load service tiers.");
      } finally {
        setTiersLoading(false);
      }
    })();
  }, []);

  // ── Load default pricing ──
  useEffect(() => {
    void (async () => {
      try {
        const res = await api.getPricing();
        const d = res.data;
        if (Array.isArray(d.firstTenDayPrices) && d.firstTenDayPrices.length === 10)
          setDefPrices(d.firstTenDayPrices);
        if (typeof d.day11To30Increment === "number") setDefTier2(d.day11To30Increment);
        if (typeof d.day31PlusIncrement === "number") setDefTier3(d.day31PlusIncrement);
      } catch {
        setDefError("Failed to load default pricing. Showing defaults.");
      } finally {
        setDefLoading(false);
      }
    })();
  }, []);

  // ── Tier form helpers ──
  const startNew = () => {
    setForm(emptyForm());
    setSaveError("");
    setSaveSuccess(false);
    setEditingId("new");
  };

  const startEdit = (t: BusinessTier) => {
    setForm(tierToForm(t));
    setSaveError("");
    setSaveSuccess(false);
    setEditingId(t._id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSaveError("");
    setSaveSuccess(false);
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) return "Tier name is required.";
    if (form.features.length === 0) return "Add at least one feature.";
    if (form.prices.length !== 10) return "All 10 day prices are required.";
    if (form.prices.some((p) => p < 0)) return "Prices cannot be negative.";
    if (form.tier2Inc < 0) return "Days 11–30 increment cannot be negative.";
    if (form.tier3Inc < 0) return "Day 31+ increment cannot be negative.";
    return null;
  };

  const handleSaveTier = async () => {
    const err = validateForm();
    if (err) { setSaveError(err); return; }

    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      features: form.features,
      firstTenDayPrices: form.prices.map(round2),
      day11To30Increment: round2(form.tier2Inc),
      day31PlusIncrement: round2(form.tier3Inc),
      isActive: form.isActive,
    };

    try {
      if (editingId === "new") {
        const res = await api.createTier(payload);
        setTiers((prev) => [...prev, res.data]);
      } else {
        const res = await api.updateTier(editingId!, payload);
        setTiers((prev) => prev.map((t) => (t._id === res.data._id ? res.data : t)));
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditingId(null);
      }, 1500);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save tier.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTier = async (id: string) => {
    setDeletingId(id);
    try {
      await api.deleteTier(id);
      setTiers((prev) => prev.filter((t) => t._id !== id));
    } catch (e) {
      setTiersError(e instanceof Error ? e.message : "Failed to delete tier.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Default pricing save ──
  const handleSaveDefault = async () => {
    if (defPrices.length !== 10 || defPrices.some((p) => p < 0)) {
      setDefError("All 10 day prices are required and must be non-negative.");
      return;
    }
    setDefSaving(true);
    setDefSuccess(false);
    setDefError("");
    try {
      const res = await api.updatePricing({
        firstTenDayPrices: defPrices.map(round2),
        day11To30Increment: round2(defTier2),
        day31PlusIncrement: round2(defTier3),
      });
      const d = res.data;
      if (Array.isArray(d.firstTenDayPrices) && d.firstTenDayPrices.length === 10)
        setDefPrices(d.firstTenDayPrices);
      if (typeof d.day11To30Increment === "number") setDefTier2(d.day11To30Increment);
      if (typeof d.day31PlusIncrement === "number") setDefTier3(d.day31PlusIncrement);
      setDefSuccess(true);
      setTimeout(() => setDefSuccess(false), 4000);
    } catch (e) {
      setDefError(e instanceof Error ? e.message : "Failed to save pricing.");
    } finally {
      setDefSaving(false);
    }
  };

  // ── Loading skeleton ──
  if (tiersLoading && defLoading) {
    return (
      <div className="max-w-5xl space-y-4 animate-pulse">
        {[60, 200, 160, 260].map((h, i) => (
          <div key={i} className="rounded-2xl" style={{ height: h, background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-5xl space-y-6 animate-fade-in pb-10">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
          Pricing Configuration
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Manage service tier packages with features and pricing, or configure default
          business pricing.
        </p>
      </div>

      {/* ── Tabs ── */}
      <div
        className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: "var(--muted)" }}
      >
        {(
          [
            { id: "tiers", icon: <Tag className="h-4 w-4" />, label: "Service Tiers" },
            { id: "compare", icon: <Layers className="h-4 w-4" />, label: "Compare Tiers" },
            { id: "default", icon: <BadgeDollarSign className="h-4 w-4" />, label: "Business Pricing" },
          ] as const
        ).map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === id
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={
              activeTab !== id
                ? { color: "var(--muted-foreground)" }
                : {}
            }
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SERVICE TIERS TAB                                                  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "tiers" && (
        <div className="space-y-6">
          {/* Global tier errors */}
          {tiersError && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <Info className="h-4 w-4 shrink-0" />
              {tiersError}
              <button className="ml-auto text-xs underline" onClick={() => setTiersError("")}>
                Dismiss
              </button>
            </div>
          )}

          {/* ── EDITOR VIEW ── */}
          {editingId !== null ? (
            <div className="space-y-6">
              {/* Editor header */}
              <div
                className="flex items-center justify-between rounded-2xl border px-5 py-4"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <Star className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                      {editingId === "new" ? "New Service Tier" : `Editing: ${form.name}`}
                    </h2>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      Define features and pricing bands for this tier.
                    </p>
                  </div>
                </div>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors hover:opacity-80"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--muted-foreground)",
                    background: "var(--muted)",
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </div>

              {/* Save feedback */}
              {saveSuccess && (
                <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Tier saved successfully.
                </div>
              )}
              {saveError && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <Info className="h-4 w-4 shrink-0" />
                  {saveError}
                </div>
              )}

              {/* ── Tier metadata ── */}
              <div
                className="rounded-2xl border p-5 space-y-4"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                  Tier Details
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
                      Tier Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Basic, Standard, Premium"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none bg-transparent"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                        background: "var(--card)",
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="Short description shown on the tier card"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none bg-transparent"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                        background: "var(--card)",
                      }}
                    />
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between rounded-xl border px-4 py-3"
                  style={{ borderColor: "var(--border)", background: "var(--muted)" }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      Active
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      Inactive tiers cannot be assigned to new bookings.
                    </p>
                  </div>
                  <button
                    type="button"
                    title={form.isActive ? "Deactivate tier" : "Activate tier"}
                    aria-label={form.isActive ? "Deactivate tier" : "Activate tier"}
                    onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.isActive ? "bg-primary" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        form.isActive ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* ── Features ── */}
              <div
                className="rounded-2xl border p-5 space-y-4"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <div>
                  <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                    Features
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    List what customers get with this tier (e.g. free cancellation, valet service).
                  </p>
                </div>
                <FeaturesEditor
                  features={form.features}
                  onChange={(f) => setForm((s) => ({ ...s, features: f }))}
                />
              </div>

              {/* ── Pricing ── */}
              <div
                className="rounded-2xl border p-5"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <h3 className="text-sm font-bold mb-5" style={{ color: "var(--foreground)" }}>
                  Pricing Bands
                </h3>
                <PricingEditor
                  prices={form.prices}
                  tier2Inc={form.tier2Inc}
                  tier3Inc={form.tier3Inc}
                  onPriceChange={(i, v) =>
                    setForm((f) => {
                      const next = [...f.prices];
                      next[i] = round2(v);
                      return { ...f, prices: next };
                    })
                  }
                  onTier2Change={(v) => setForm((f) => ({ ...f, tier2Inc: v }))}
                  onTier3Change={(v) => setForm((f) => ({ ...f, tier3Inc: v }))}
                />
              </div>

              {/* ── Save button ── */}
              <button
                onClick={handleSaveTier}
                disabled={saving}
                className="bg-primary w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {editingId === "new" ? "Create Tier" : "Save Changes"}
                  </>
                )}
              </button>
            </div>
          ) : (
            /* ── LIST VIEW ── */
            <div className="space-y-6">
              {/* List header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {tiers.length === 0
                      ? "No service tiers yet"
                      : `${tiers.length} tier${tiers.length !== 1 ? "s" : ""} configured`}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    Each tier defines features and a 3-band pricing schedule.
                  </p>
                </div>
                <button
                  onClick={startNew}
                  className="bg-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  Add Tier
                </button>
              </div>

              {/* Empty state */}
              {tiers.length === 0 && (
                <div
                  className="rounded-2xl border border-dashed flex flex-col items-center justify-center py-16 gap-3"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ background: "var(--muted)" }}
                  >
                    <Tag className="h-6 w-6" style={{ color: "var(--muted-foreground)" }} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      No service tiers created
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                      Create tiers like Basic, Standard, and Premium with their own features and
                      pricing.
                    </p>
                  </div>
                  <button
                    onClick={startNew}
                    className="bg-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 mt-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create First Tier
                  </button>
                </div>
              )}

              {/* Tier cards grid */}
              {tiers.length > 0 && (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {tiers.map((tier, idx) => (
                    <TierCard
                      key={tier._id}
                      tier={tier}
                      palette={CARD_PALETTES[idx % CARD_PALETTES.length]}
                      onEdit={() => startEdit(tier)}
                      onDelete={() => handleDeleteTier(tier._id)}
                      deleting={deletingId === tier._id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* COMPARE TIERS TAB                                                  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "compare" && (
        <div className="space-y-6">
          <div>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Side-by-side pricing comparison across all service tiers. Prices
              shown are cumulative totals for each duration.
            </p>
          </div>

          {tiersLoading ? (
            <div className="h-40 rounded-2xl animate-pulse" style={{ background: "var(--border)" }} />
          ) : tiers.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed flex flex-col items-center justify-center py-16 gap-3"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: "var(--muted)" }}
              >
                <SplitSquareHorizontal className="h-6 w-6" style={{ color: "var(--muted-foreground)" }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  No tiers to compare
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                  Create service tiers in the Service Tiers tab first.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("tiers")}
                className="bg-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 mt-2"
              >
                <Tag className="h-4 w-4" />
                Go to Service Tiers
              </button>
            </div>
          ) : (
            <>
              {/* ── Feature comparison ── */}
              <div
                className="rounded-2xl border overflow-hidden"
                style={{ borderColor: "var(--border)", background: "var(--card)" }}
              >
                <div
                  className="px-5 py-4 border-b flex items-center gap-3"
                  style={{ borderColor: "var(--border)", background: "var(--muted)" }}
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                    Features by Tier
                  </h3>
                </div>

                {/* Header row */}
                <div
                  className="grid border-b px-5 py-3"
                  style={{
                    gridTemplateColumns: `1fr repeat(${tiers.length}, 1fr)`,
                    borderColor: "var(--border)",
                    background: "var(--muted)",
                  }}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                    Feature
                  </span>
                  {tiers.map((t, idx) => (
                    <span
                      key={t._id}
                      className={`text-xs font-bold text-center ${CARD_PALETTES[idx % CARD_PALETTES.length].badge} px-2 py-0.5 rounded-full mx-auto`}
                    >
                      {t.name}
                    </span>
                  ))}
                </div>

                {/* Collect all unique features */}
                {(() => {
                  const allFeatures = Array.from(
                    new Set(tiers.flatMap((t) => t.features)),
                  );
                  if (allFeatures.length === 0) {
                    return (
                      <div className="px-5 py-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                        No features defined on any tier yet.
                      </div>
                    );
                  }
                  return allFeatures.map((feature, fi) => (
                    <div
                      key={fi}
                      className="grid items-center px-5 py-3 border-b last:border-b-0"
                      style={{
                        gridTemplateColumns: `1fr repeat(${tiers.length}, 1fr)`,
                        borderColor: "var(--border)",
                        background: fi % 2 === 0 ? "var(--card)" : "var(--muted)",
                      }}
                    >
                      <span className="text-xs" style={{ color: "var(--foreground)" }}>
                        {feature}
                      </span>
                      {tiers.map((t) => (
                        <div key={t._id} className="flex justify-center">
                          {t.features.includes(feature) ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <X className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                          )}
                        </div>
                      ))}
                    </div>
                  ));
                })()}
              </div>

              {/* ── Pricing comparison table ── */}
              <div
                className="rounded-2xl border overflow-hidden"
                style={{ borderColor: "var(--border)", background: "var(--card)" }}
              >
                <div
                  className="px-5 py-4 border-b flex items-center gap-3"
                  style={{ borderColor: "var(--border)", background: "var(--muted)" }}
                >
                  <BadgeDollarSign className="h-4 w-4 text-primary shrink-0" />
                  <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                    Pricing Comparison
                  </h3>
                  <span className="text-xs ml-auto" style={{ color: "var(--muted-foreground)" }}>
                    Cumulative total per duration
                  </span>
                </div>

                {/* Column header */}
                <div
                  className="grid border-b px-5 py-3"
                  style={{
                    gridTemplateColumns: `80px repeat(${tiers.length}, 1fr)`,
                    borderColor: "var(--border)",
                    background: "var(--muted)",
                  }}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                    Days
                  </span>
                  {tiers.map((t, idx) => (
                    <span
                      key={t._id}
                      className={`text-xs font-bold text-center ${CARD_PALETTES[idx % CARD_PALETTES.length].badge} px-2 py-0.5 rounded-full mx-auto`}
                    >
                      {t.name}
                    </span>
                  ))}
                </div>

                {PREVIEW_DAYS.map((day, ri) => {
                  const prices = tiers.map((t) =>
                    calcPrice(day, t.firstTenDayPrices, t.day11To30Increment, t.day31PlusIncrement),
                  );
                  const minPrice = Math.min(...prices);
                  const band = getBand(day);

                  return (
                    <div
                      key={day}
                      className="grid items-center px-5 py-3 border-b last:border-b-0"
                      style={{
                        gridTemplateColumns: `80px repeat(${tiers.length}, 1fr)`,
                        borderColor: "var(--border)",
                        background: ri % 2 === 0 ? "var(--card)" : "var(--muted)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${BAND_COLORS[band].dot}`} />
                        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {day}d
                        </span>
                      </div>
                      {prices.map((price, pi) => (
                        <div key={pi} className="text-center">
                          <span
                            className={`text-sm font-bold ${
                              price === minPrice ? "text-emerald-600" : ""
                            }`}
                            style={price !== minPrice ? { color: "var(--foreground)" } : {}}
                          >
                            {formatPrice(price)}
                          </span>
                          {price === minPrice && prices.filter(p => p === minPrice).length < prices.length && (
                            <span className="block text-[10px] text-emerald-600 font-semibold">
                              lowest
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* ── Per-tier pricing summary cards ── */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tiers.map((tier, idx) => {
                  const palette = CARD_PALETTES[idx % CARD_PALETTES.length];
                  const day1 = tier.firstTenDayPrices[0] ?? 0;
                  const day10 = tier.firstTenDayPrices[9] ?? 0;
                  const day30 = day10 + 20 * tier.day11To30Increment;
                  const day60 = day30 + 30 * tier.day31PlusIncrement;
                  return (
                    <div
                      key={tier._id}
                      className={`rounded-2xl border overflow-hidden ring-1 ${palette.ring}`}
                      style={{ borderColor: "var(--border)", background: "var(--card)" }}
                    >
                      <div className={`${palette.header} px-5 py-3`}>
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-white text-sm">{tier.name}</p>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              tier.isActive ? "bg-white/20 text-white" : "bg-white/10 text-white/60"
                            }`}
                          >
                            {tier.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        {tier.description && (
                          <p className="text-xs text-white/75 mt-0.5">{tier.description}</p>
                        )}
                      </div>
                      <div className="px-5 py-4 space-y-2">
                        {[
                          { label: "Day 1", value: formatPrice(day1) },
                          { label: "Day 10", value: formatPrice(day10) },
                          { label: "Days 11–30", value: `+${formatPrice(tier.day11To30Increment)}/day` },
                          { label: "Day 31+", value: `+${formatPrice(tier.day31PlusIncrement)}/day` },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-center justify-between text-xs">
                            <span style={{ color: "var(--muted-foreground)" }}>{label}</span>
                            <span className="font-semibold" style={{ color: "var(--foreground)" }}>{value}</span>
                          </div>
                        ))}
                        <div
                          className="pt-2 mt-2 border-t space-y-1"
                          style={{ borderColor: "var(--border)" }}
                        >
                          {[
                            { label: "30-day total", value: formatPrice(day30) },
                            { label: "60-day total", value: formatPrice(day60) },
                          ].map(({ label, value }) => (
                            <div
                              key={label}
                              className="flex items-center justify-between rounded-lg px-3 py-2"
                              style={{ background: "var(--muted)" }}
                            >
                              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</span>
                              <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* BUSINESS PRICING TAB                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "default" && (
        <div className="space-y-6">
          <div>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              This is the fallback pricing used when no service tier is assigned. Days 1–10 are
              set individually; days 11–30 and 31+ scale from the previous band using a
              configurable daily increment.
            </p>
          </div>

          {defSuccess && (
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Default pricing saved successfully.
            </div>
          )}
          {defError && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <Info className="h-4 w-4 shrink-0" />
              {defError}
            </div>
          )}

          {defLoading ? (
            <div className="space-y-4 animate-pulse">
              {[200, 160, 160].map((h, i) => (
                <div key={i} className="rounded-2xl" style={{ height: h, background: "var(--border)" }} />
              ))}
            </div>
          ) : (
            <>
              <PricingEditor
                prices={defPrices}
                tier2Inc={defTier2}
                tier3Inc={defTier3}
                onPriceChange={(i, v) =>
                  setDefPrices((prev) => {
                    const next = [...prev];
                    next[i] = round2(v);
                    return next;
                  })
                }
                onTier2Change={(v) => { setDefTier2(v); setDefSuccess(false); setDefError(""); }}
                onTier3Change={(v) => { setDefTier3(v); setDefSuccess(false); setDefError(""); }}
              />

              <button
                onClick={handleSaveDefault}
                disabled={defSaving}
                className="bg-primary w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {defSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Default Pricing
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
