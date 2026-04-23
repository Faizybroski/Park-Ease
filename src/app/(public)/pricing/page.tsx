"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageHero from "@/components/shared/PageHero";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NoiseTexture } from "@/components/ui/noise-texture";
import { DateTimePicker } from "@/components/ui/DatePicker";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  CalendarClock,
  ArrowRight,
  Layers,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDayCount, formatPrice } from "@/lib/utils";
import { BusinessTier } from "@/types";

function calcTierPrice(days: number, tier: BusinessTier): number {
  if (days <= 0) return 0;
  if (days <= 10) return tier.firstTenDayPrices[days - 1] ?? 0;
  const day10 = tier.firstTenDayPrices[9] ?? 0;
  if (days <= 30) return day10 + (days - 10) * tier.day11To30Increment;
  return (
    day10 +
    20 * tier.day11To30Increment +
    (days - 30) * tier.day31PlusIncrement
  );
}

function PricingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [startDate, setStartDate] = useState(
    searchParams.get("start") || "",
  );
  const [endDate, setEndDate] = useState(searchParams.get("end") || "");
  const [dateError, setDateError] = useState("");

  const [tiers, setTiers] = useState<BusinessTier[]>([]);
  const [tiersLoading, setTiersLoading] = useState(true);
  const [tiersError, setTiersError] = useState(false);

  useEffect(() => {
    api
      .getPublicTiers()
      .then((res) => {
        setTiers(res.data);
        setTiersLoading(false);
      })
      .catch(() => {
        setTiersError(true);
        setTiersLoading(false);
      });
  }, []);

  const hasDates =
    !!startDate &&
    !!endDate &&
    new Date(endDate) > new Date(startDate) &&
    new Date(startDate) > new Date();

  const localDays = hasDates
    ? Math.max(
        1,
        Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            86_400_000,
        ),
      )
    : null;

  const handleSeePrices = () => {
    setDateError("");
    if (!startDate) { setDateError("Please select a drop-off date."); return; }
    if (!endDate) { setDateError("Please select a pick-up date."); return; }
    if (new Date(startDate) <= new Date()) { setDateError("Drop-off must be in the future."); return; }
    if (new Date(endDate) <= new Date(startDate)) { setDateError("Pick-up must be after drop-off."); return; }
    // update URL so the tier cards show prices
    const p = new URLSearchParams();
    p.set("start", startDate);
    p.set("end", endDate);
    router.replace(`/pricing?${p.toString()}`);
  };

  const handleBookTier = (tierId: string) => {
    if (!hasDates) return;
    const p = new URLSearchParams();
    p.set("start", startDate);
    p.set("end", endDate);
    p.set("tier", tierId);
    router.push(`/book?${p.toString()}`);
  };

  return (
    <>
      <PageHero
        title="Choose Your Parking Package"
        subtitle="Select your dates, pick a service tier, and book in seconds"
      />

      <div className="min-h-screen py-10 bg-muted/40">
        <div className="max-w-5xl mx-auto px-4 space-y-8">

          {/* ── Date selector card ──────────────────────────────── */}
          <Card className="rounded-2xl p-6 lg:p-8 bg-card border border-primary ring-0 dark:bg-white/20">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 text-lg font-bold mb-1">
                <CalendarClock className="h-6 w-6 text-primary dark:text-primaryblue" />
                {hasDates
                  ? `Your Dates · ${formatDayCount(localDays!)}`
                  : "Select Your Dates"}
              </CardTitle>
              {hasDates && (
                <CardDescription>
                  Prices below are calculated for your selected stay. Adjust
                  dates to update prices.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-0 mt-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <p className="text-sm font-medium mb-2">
                    Drop-off Date &amp; Time
                    <span className="text-red-500">*</span>
                  </p>
                  <DateTimePicker
                    value={startDate}
                    onChange={(v) => { setStartDate(v); setDateError(""); }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">
                    Pick-up Date &amp; Time
                    <span className="text-red-500">*</span>
                  </p>
                  <DateTimePicker
                    value={endDate}
                    onChange={(v) => { setEndDate(v); setDateError(""); }}
                  />
                </div>
              </div>

              {dateError && (
                <p className="mt-3 text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {dateError}
                </p>
              )}

              {!hasDates && (
                <button
                  type="button"
                  onClick={handleSeePrices}
                  className="relative mt-5 inline-flex items-center gap-2 rounded-full text-sm font-semibold px-6 py-2.5 text-white overflow-hidden bg-primary hover:bg-white border border-primary hover:text-primary"
                  
                >
                  
                  <span className="relative z-10 flex items-center gap-2">
                    See Prices <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              )}
            </CardContent>
          </Card>

          {/* ── Tier cards ─────────────────────────────────────── */}
          {tiersLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {tiersError && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-destructive">
              <AlertCircle className="h-5 w-5" />
              Unable to load service tiers. Please try again later.
            </div>
          )}

          {!tiersLoading && !tiersError && tiers.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary dark:text-primaryblue" />
                <h2 className="text-lg font-bold">
                  {hasDates
                    ? `Available Service Tiers — ${formatDayCount(localDays!)}`
                    : "Available Service Tiers"}
                </h2>
              </div>

              <div
                className={`grid gap-6 ${
                  tiers.length === 1
                    ? "max-w-sm"
                    : tiers.length === 2
                      ? "sm:grid-cols-2"
                      : "sm:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {tiers.map((tier) => {
                  const tierPrice =
                    localDays !== null ? calcTierPrice(localDays, tier) : null;

                  return (
                    <Card
                      key={tier._id}
                      className="rounded-2xl border border-border bg-card ring-0 flex flex-col overflow-hidden hover:border-primary/50 hover:shadow-md transition-all"
                    >
                      <CardHeader className="p-6 pb-4">
                        <CardTitle className="text-lg font-bold">
                          {tier.name}
                        </CardTitle>
                        {tier.description && (
                          <CardDescription>{tier.description}</CardDescription>
                        )}

                        {/* Price */}
                        <div className="mt-3">
                          {tierPrice !== null ? (
                            <>
                              <p className="text-3xl font-extrabold text-primary dark:text-primaryblue leading-none">
                                {formatPrice(tierPrice)}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                for {formatDayCount(localDays!)} ·{" "}
                                {formatPrice(tierPrice / localDays!)}/day
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              from{" "}
                              <span className="font-bold text-primary dark:text-primaryblue">
                                {formatPrice(tier.firstTenDayPrices[0] ?? 0)}
                              </span>
                              /day — select dates above to see your price
                            </p>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="px-6 pb-6 flex flex-col flex-1">
                        {/* Features */}
                        {tier.features.length > 0 && (
                          <ul className="space-y-2 mb-6 flex-1">
                            {tier.features.map((f, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-sm"
                              >
                                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
                                <span className="text-foreground leading-snug">
                                  {f}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Book button */}
                        <button
                          type="button"
                          disabled={!hasDates}
                          onClick={() => handleBookTier(tier._id)}
                          className={`relative w-full inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold px-5 py-3 transition-opacity overflow-hidden ${
                            hasDates
                              ? "hover:opacity-90 cursor-pointer bg-primary text-white border border-primary hover:text-primary hover:bg-white"
                              : "bg-muted text-muted-foreground cursor-not-allowed"
                          }`}
                          
                        >
                          
                          <span className="relative z-10 flex items-center gap-2">
                            {hasDates
                              ? `Book ${tier.name}`
                              : "Select dates above"}
                            {hasDates && (
                              <ArrowRight className="h-4 w-4" />
                            )}
                          </span>
                        </button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {!tiersLoading && !tiersError && tiers.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <p className="text-muted-foreground">
                No service tiers available at the moment.
              </p>
              <Link
                href="/contact"
                className="text-sm text-primary dark:text-primaryblue hover:underline"
              >
                Contact us for pricing
              </Link>
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground pb-4">
            All prices include VAT. Final price is confirmed at checkout based
            on your exact dates.
          </p>
        </div>
      </div>
    </>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
