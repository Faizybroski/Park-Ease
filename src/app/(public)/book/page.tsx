"use client";

import { Suspense, useEffect, useState } from "react";
import { BusinessTier } from "@/types";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { formatDayCount, formatPrice } from "@/lib/utils";
import { DateTimePicker } from "@/components/ui/DatePicker";
import PageHero from "@/components/shared/PageHero";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NoiseTexture } from "@/components/ui/noise-texture";
import {
  CalendarClock,
  User,
  Mail,
  Phone,
  Car,
  Hash,
  Palette,
  PlaneTakeoff,
  PlaneLanding,
  Loader2,
  AlertCircle,
  Tag,
  Ban,
  CheckCircle2,
  Layers,
  ArrowLeft,
} from "lucide-react";

// ─── regex patterns ───────────────────────────────────────────────
const FLIGHT_REGEX = /^[A-Z]{2,3}\d{1,4}[A-Z]?$/i;
const TERMINAL_REGEX = /^T\d{1,2}$/i;
const CAR_NUMBER_REGEX = /^[A-Z0-9][A-Z0-9 -]{3,10}[A-Z0-9]$/i;
const PHONE_REGEX = /^\+?[\d\s()-]{8,18}$/;

// ─── zod schema ───────────────────────────────────────────────────
const bookingSchema = z
  .object({
    userName: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100),
    userEmail: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    userPhone: z
      .string()
      .trim()
      .min(1, "Phone number is required")
      .regex(PHONE_REGEX, "Enter a valid phone number (e.g. +44 7700 900000)"),
    carMake: z.string().trim().min(1, "Car make is required").max(50),
    carModel: z.string().trim().min(1, "Car model is required").max(50),
    carNumber: z
      .string()
      .trim()
      .min(1, "Registration number is required")
      .regex(CAR_NUMBER_REGEX, "Enter a valid registration (e.g. AB12 CDE)"),
    carColor: z.string().trim().min(1, "Car colour is required").max(30),
    bookedStartTime: z
      .string()
      .min(1, "Drop-off date & time is required")
      .refine(
        (v) => new Date(v) > new Date(),
        "Drop-off must be in the future",
      ),
    bookedEndTime: z.string().min(1, "Pick-up date & time is required"),
    departureTerminal: z
      .string()
      .trim()
      .optional()
      .refine(
        (v) => !v || TERMINAL_REGEX.test(v),
        "Invalid terminal (e.g. T1, T2)",
      ),
    departureFlightNo: z
      .string()
      .trim()
      .optional()
      .refine(
        (v) => !v || FLIGHT_REGEX.test(v),
        "Invalid flight number (e.g. BA123)",
      ),
    arrivalTerminal: z
      .string()
      .trim()
      .optional()
      .refine(
        (v) => !v || TERMINAL_REGEX.test(v),
        "Invalid terminal (e.g. T1, T5)",
      ),
    arrivalFlightNo: z
      .string()
      .trim()
      .optional()
      .refine(
        (v) => !v || FLIGHT_REGEX.test(v),
        "Invalid flight number (e.g. BA456)",
      ),
  })
  .refine(
    (d) =>
      !d.bookedStartTime ||
      !d.bookedEndTime ||
      new Date(d.bookedEndTime) > new Date(d.bookedStartTime),
    { message: "Pick-up must be after drop-off", path: ["bookedEndTime"] },
  )
  .refine(
    (d) => {
      if (!d.bookedStartTime || !d.bookedEndTime) return true;
      return (
        new Date(d.bookedEndTime).getTime() -
          new Date(d.bookedStartTime).getTime() >=
        3_600_000
      );
    },
    {
      message:
        "Booking must be at least 1 hour. Partial days are charged as full days.",
      path: ["bookedEndTime"],
    },
  );

type BookingFormValues = z.infer<typeof bookingSchema>;

// ─── client-side tier price helper ───────────────────────────────
function calcTierPrice(days: number, tier: BusinessTier): number {
  if (days <= 0) return 0;
  if (days <= 10) return tier.firstTenDayPrices[days - 1] ?? 0;
  const day10 = tier.firstTenDayPrices[9] ?? 0;
  if (days <= 30) return day10 + (days - 10) * tier.day11To30Increment;
  return (
    day10 + 20 * tier.day11To30Increment + (days - 30) * tier.day31PlusIncrement
  );
}

// ─── main form component ─────────────────────────────────────────
function BookingFormContent() {
  const searchParams = useSearchParams();
  const tierParam = searchParams.get("tier");

  // booking-enabled guard
  const [bookingEnabled, setBookingEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    api
      .getBookingStatus()
      .then((res) => setBookingEnabled(res.data.bookingEnabled))
      .catch(() => setBookingEnabled(true));
  }, []);

  // service tiers
  const [tiers, setTiers] = useState<BusinessTier[]>([]);
  useEffect(() => {
    api
      .getPublicTiers()
      .then((res) => setTiers(res.data))
      .catch(() => setTiers([]));
  }, []);

  // Pre-select tier from URL param; validate once tiers load
  const [selectedTierId, setSelectedTierId] = useState<string | null>(
    tierParam,
  );
  useEffect(() => {
    if (tierParam && tiers.length > 0) {
      const exists = tiers.some((t) => t._id === tierParam);
      if (!exists) setSelectedTierId(null);
    }
  }, [tiers, tierParam]);

  // Whether the tier was pre-selected via the pricing flow
  const tierPreSelected = !!tierParam && selectedTierId === tierParam;

  // price preview for the selected dates
  const [price, setPrice] = useState<{
    totalPrice: number | null;
    totalDays: number | null;
    loading: boolean;
    error: boolean;
  }>({ totalPrice: null, totalDays: null, loading: false, error: false });

  // checkout state
  const [pending, setPending] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      userName: "",
      userEmail: "",
      userPhone: "",
      carMake: "",
      carModel: "",
      carNumber: "",
      carColor: "",
      bookedStartTime: searchParams.get("start") || "",
      bookedEndTime: searchParams.get("end") || "",
      departureTerminal: "",
      departureFlightNo: "",
      arrivalTerminal: "",
      arrivalFlightNo: "",
    },
    mode: "onBlur",
  });

  const startTime = form.watch("bookedStartTime");
  const endTime = form.watch("bookedEndTime");

  // fetch price when dates change
  useEffect(() => {
    if (!startTime || !endTime) return;
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) return;

    // setPrice((p) => ({ ...p, loading: true, error: false }));
    // api
    //   .calculatePrice(start.toISOString(), end.toISOString())
    // .then((res) =>
    // setPrice({
    //   totalPrice: res.data.finalPrice,
    //   totalDays: res.data.totalDays,
    //   loading: false,
    //   error: false,
    // }),
    // )
    // .catch(() =>
    //   setPrice({ totalPrice: null, totalDays: null, loading: false, error: true }),
    // );
  }, [startTime, endTime]);

  // checkout handler
  const handleBook = async () => {
    setCheckoutError(null);
    const valid = await form.trigger();
    if (!valid) return;

    const data = form.getValues();
    setPending(true);
    try {
      const res = await api.createCheckoutSession({
        ...data,
        bookedStartTime: new Date(data.bookedStartTime).toISOString(),
        bookedEndTime: new Date(data.bookedEndTime).toISOString(),
        ...(selectedTierId ? { tierId: selectedTierId } : {}),
      });
      window.location.href = res.data.checkoutUrl;
    } catch (err) {
      setCheckoutError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setPending(false);
    }
  };

  // booking disabled guard
  if (bookingEnabled === false) {
    return (
      <div className="min-h-screen py-20 bg-muted/40 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
            <Ban className="w-8 h-8 text-red-500 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Bookings Temporarily Unavailable
          </h1>
          <p className="text-muted-foreground mb-6">
            We are not accepting new parking reservations at the moment. Please
            check back soon or contact us for assistance.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Contact Us
          </a>
        </div>
      </div>
    );
  }

  const hasDates =
    !!startTime && !!endTime && new Date(endTime) > new Date(startTime);

  // Compute days locally so tier prices show instantly (no API wait)
  const localDays = hasDates
    ? Math.max(
        1,
        Math.ceil(
          (new Date(endTime).getTime() - new Date(startTime).getTime()) /
            86_400_000,
        ),
      )
    : null;

  const selectedTier = tiers.find((t) => t._id === selectedTierId) ?? null;
  const tierPrice =
    selectedTier && localDays !== null
      ? calcTierPrice(localDays, selectedTier)
      : null;
  // const displayPrice = tierPrice ?? price.totalPrice;
  // const displayDays = localDays ?? price.totalDays;
  // const hasPrice = displayPrice !== null && displayDays !== null;
  const needsTierSelection = tiers.length > 0 && !selectedTierId;

  return (
    <>
      <PageHero
        title="Book Your Parking"
        subtitle="Fill in your details and reserve your spot in seconds"
      />
      <div className="min-h-screen py-10 bg-muted/40">
        <div className="max-w-3xl mx-auto px-4">
          <Form {...form}>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="space-y-6"
              noValidate
            >
              {/* ── checkout error ──────────────────────────── */}
              {checkoutError && (
                <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* ══════════════════════════════════════════════ */}
              {/*  BOOKING SUMMARY (when coming from pricing)   */}
              {/* ══════════════════════════════════════════════ */}
              {tierPreSelected && selectedTier && (
                <Card className="rounded-2xl p-5 bg-primary/5 text-card-foreground border border-primary ring-0">
                  <CardContent className="p-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary dark:text-primaryblue shrink-0" />
                        <p className="font-bold text-foreground">
                          {selectedTier.name}
                        </p>
                      </div>
                      {localDays !== null && tierPrice !== null && (
                        <p className="text-sm text-muted-foreground pl-7">
                          {formatDayCount(localDays)} ·{" "}
                          <span className="font-semibold text-primary dark:text-primaryblue">
                            {formatPrice(tierPrice)}
                          </span>{" "}
                          total
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/pricing?start=${encodeURIComponent(startTime)}&end=${encodeURIComponent(endTime)}`}
                      className="flex items-center gap-1.5 text-sm text-primary dark:text-primaryblue hover:underline shrink-0"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Change tier
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* ══════════════════════════════════════════════ */}
              {/*  DATES SECTION                                */}
              {/* ══════════════════════════════════════════════ */}
              <Card className="rounded-2xl p-6 lg:p-8 bg-card text-card-foreground border border-primary ring-0">
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold mb-4">
                    <CalendarClock className="h-6 w-6 text-primary dark:text-primaryblue" />
                    Parking Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-5 p-0">
                  {/* Drop-off */}
                  <FormField
                    control={form.control}
                    name="bookedStartTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Drop-off Date &amp; Time
                          <span className="text-red-500 dark:text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <DateTimePicker
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Pick-up */}
                  <FormField
                    control={form.control}
                    name="bookedEndTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Pick-up Date &amp; Time
                          <span className="text-red-500 dark:text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <DateTimePicker
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* ══════════════════════════════════════════════ */}
              {/*  SERVICE TIER SELECTOR                        */}
              {/* ══════════════════════════════════════════════ */}
              {hasDates && tiers.length > 0 && !tierPreSelected && (
                <Card className="rounded-2xl p-6 lg:p-8 bg-card text-card-foreground border border-primary ring-0">
                  <CardHeader className="p-0">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold mb-1">
                      <Layers className="h-6 w-6 text-primary dark:text-primaryblue" />
                      Choose Your Service Tier
                    </CardTitle>
                    <CardDescription>
                      Select the service package that suits you — each tier
                      includes different features and pricing.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-0 mt-5">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {tiers.map((tier) => {
                        const isSelected = selectedTierId === tier._id;
                        const tierPricePreview =
                          localDays !== null
                            ? calcTierPrice(localDays, tier)
                            : null;

                        return (
                          <button
                            key={tier._id}
                            type="button"
                            onClick={() =>
                              setSelectedTierId((prev) =>
                                prev === tier._id ? null : tier._id,
                              )
                            }
                            className={`text-left rounded-2xl border p-4 transition-all hover:shadow-md focus:outline-none ${
                              isSelected
                                ? "border-primary ring-2 ring-primary/20 bg-primary/2"
                                : "border-border bg-background hover:border-primary/50"
                            }`}
                          >
                            {/* Header */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div>
                                <p className="font-bold text-sm text-foreground">
                                  {tier.name}
                                </p>
                                {tier.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {tier.description}
                                  </p>
                                )}
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary dark:text-primaryblue" />
                              )}
                            </div>

                            {/* Price */}
                            {tierPricePreview !== null ? (
                              <div className="mb-3">
                                <p className="text-lg font-bold text-primary dark:text-primaryblue leading-none">
                                  {formatPrice(tierPricePreview)}
                                </p>
                                {localDays !== null && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    for {formatDayCount(localDays)}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="mb-3">
                                <p className="text-xs text-muted-foreground">
                                  from{" "}
                                  {formatPrice(tier.firstTenDayPrices[0] ?? 0)}
                                  /day
                                </p>
                              </div>
                            )}

                            {/* Features */}
                            {tier.features.length > 0 && (
                              <ul className="space-y-1.5">
                                {tier.features.slice(0, 4).map((f, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-1.5"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
                                    <span className="text-xs text-foreground leading-snug">
                                      {f}
                                    </span>
                                  </li>
                                ))}
                                {tier.features.length > 4 && (
                                  <li className="text-xs text-muted-foreground pl-5">
                                    +{tier.features.length - 4} more
                                  </li>
                                )}
                              </ul>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {needsTierSelection && (
                      <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        Please select a service tier to continue.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ══════════════════════════════════════════════ */}
              {/*  PERSONAL DETAILS SECTION                     */}
              {/* ══════════════════════════════════════════════ */}
              <Card className="rounded-2xl p-6 lg:p-8 bg-card text-card-foreground border border-primary ring-0">
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold mb-4">
                    <User className="h-6 w-6 text-primary dark:text-primaryblue" />
                    Personal Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-5 p-0">
                  <FormField
                    control={form.control}
                    name="userName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Full Name<span className="text-red-500 dark:text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary dark:text-primaryblue" />
                            <Input
                              placeholder="John Smith"
                              className="pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="userEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Email Address<span className="text-red-500 dark:text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary dark:text-primaryblue" />
                            <Input
                              type="email"
                              placeholder="john@example.com"
                              className="pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="userPhone"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>
                          Phone Number<span className="text-red-500 dark:text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary dark:text-primaryblue" />
                            <Input
                              type="tel"
                              placeholder="+44 7700 900000"
                              className="pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* ══════════════════════════════════════════════ */}
              {/*  VEHICLE DETAILS SECTION                      */}
              {/* ══════════════════════════════════════════════ */}
              <Card className="rounded-2xl p-6 lg:p-8 bg-card text-card-foreground border border-primary ring-0">
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold mb-4">
                    <Car className="h-6 w-6 text-primary dark:text-primaryblue" />
                    Vehicle Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-5 p-0">
                  <FormField
                    control={form.control}
                    name="carMake"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Car Make<span className="text-red-500 dark:text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary dark:text-primaryblue" />
                            <Input
                              placeholder="e.g. Toyota"
                              className="pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="carModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Car Model<span className="text-red-500 dark:text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary dark:text-primaryblue" />
                            <Input
                              placeholder="e.g. Corolla"
                              className="pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="carNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Registration Number
                          <span className="text-red-500 dark:text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary dark:text-primaryblue" />
                            <Input
                              placeholder="e.g. AB12 CDE"
                              className="pl-9 uppercase"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="carColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Car Color<span className="text-red-500 dark:text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Palette className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary dark:text-primaryblue" />
                            <Input
                              placeholder="e.g. Silver"
                              className="pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* ══════════════════════════════════════════════ */}
              {/*  FLIGHT DETAILS (OPTIONAL)                    */}
              {/* ══════════════════════════════════════════════ */}
              <Card className="rounded-2xl p-6 lg:p-8 bg-card text-card-foreground border border-primary ring-0">
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold mb-4">
                    <PlaneTakeoff className="h-6 w-6 text-primary dark:text-primaryblue" />
                    Flight Details
                  </CardTitle>
                  <CardDescription>
                    Optional — helps us coordinate your parking
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-5 p-0">
                  <FormField
                    control={form.control}
                    name="departureTerminal"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Departure Terminal</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <PlaneTakeoff className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary dark:text-primaryblue pointer-events-none z-10" />
                            <select
                              className="w-full h-10 pl-9 pr-4 rounded-md border border-input bg-background text-sm appearance-none"
                              {...field}
                            >
                              <option value="">— Not selected —</option>
                              <option value="T1">T1</option>
                              <option value="T2">T2</option>
                              <option value="T3">T3</option>
                              <option value="T4">T4</option>
                              <option value="T5">T5</option>
                            </select>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="arrivalTerminal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Arrival Terminal</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <PlaneLanding className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary dark:text-primaryblue pointer-events-none z-10" />
                            <select
                              className="w-full h-10 pl-9 pr-4 rounded-md border border-input bg-background text-sm appearance-none"
                              {...field}
                            >
                              <option value="">— Not selected —</option>
                              <option value="T1">T1</option>
                              <option value="T2">T2</option>
                              <option value="T3">T3</option>
                              <option value="T4">T4</option>
                              <option value="T5">T5</option>
                            </select>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="arrivalFlightNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Arrival Flight No.</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <PlaneLanding className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary dark:text-primaryblue" />
                            <Input
                              placeholder="e.g. BA456"
                              className="pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* ══════════════════════════════════════════════ */}
              {/*  BOOK NOW BUTTON                              */}
              {/* ══════════════════════════════════════════════ */}
              <button
                type="button"
                disabled={
                  pending || !hasDates || needsTierSelection || price.loading
                }
                onClick={handleBook}
                className={`bg-primary relative w-full inline-flex items-center justify-center gap-2 rounded-xl text-base font-semibold px-6 py-4 transition-opacity
                  ${
                    !hasDates || needsTierSelection || price.loading
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "text-white hover:opacity-90 cursor-pointer"
                  }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {pending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Redirecting to checkout…
                    </>
                  ) : price.loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Calculating price…
                    </>
                  ) : needsTierSelection ? (
                    "Select a service tier above to continue"
                  ) : !hasDates ? (
                    "Enter your parking dates to continue"
                  ) : selectedTier ? (
                    `Book Now · ${selectedTier.name} · ${formatPrice(tierPrice!)} for ${formatDayCount(localDays!)}`
                  ) : tierPrice && localDays ? (
                    `Book Now · ${formatPrice(tierPrice)} for ${formatDayCount(localDays)}`
                  ) : (
                    "Book Now"
                  )}
                </span>
              </button>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
}

// ─── page wrapper with suspense ───────────────────────────────────
export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <BookingFormContent />
    </Suspense>
  );
}
