"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { api } from "@/lib/api";
import {
  Star,
  MapPin,
  Bus,
  Car,
  Shield,
  ShieldCheck,
  Zap,
  Check,
  Bookmark,
  ChevronDown,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Plane,
  LayoutGrid,
  Quote,
  List,
  PiggyBank,
  XCircle,
  CalendarDays,
  BadgeCheck,
  Target,
  ShieldAlert,
  Sparkles,
  Search,
  SlidersHorizontal,
  CircleCheck,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/DatePicker";
import AirportPopover from "@/components/ui/AirportPicker";
import { NoiseTexture } from "@/components/ui/noise-texture";
import { motion, AnimatePresence } from "framer-motion";
import { BusinessTier } from "@/types";
import { formatDayCount, formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

// ─── Types ────────────────────────────────────────────────────────────────────
type PriceState = {
  startingPrice: number | null;
  totalPrice: number | null;
  totalDays: number | null;
  loading: boolean;
};

const features = [
  {
    title: "Easy Booking",
    desc: "Reserve your exclusive spot in seconds with our predictive allocation engine.",
    icon: Sparkles,
    primary: false,
  },
  {
    title: "Real-time",
    desc: "Live occupancy data with 99.9% precision accuracy.",
    icon: Target,
    primary: true,
  },
  {
    title: "Secure",
    desc: "Encrypted access and 24/7 AI-monitored surveillance.",
    icon: Shield,
    primary: false,
  },
];

const reviews = [
  {
    name: "Milon Zahino",
    location: "Birmingham",
    text: `Driving around, wasting time, hoping to find a spot — it used to be one of the most frustrating parts of my trips. I’d leave early just to account for parking uncertainty, and even then, I’d sometimes end up stressed before my journey even began.

Since I started using this service, that entire experience has completely changed. I can search, compare, and reserve a space in seconds, and I know exactly where I’m going before I even leave home. When I arrive, everything is exactly as expected — no surprises, no confusion.

It’s honestly saved me a huge amount of time and mental energy. What used to feel like chaos is now a smooth, predictable part of my routine. I didn’t realize how much I needed this until I started using it.`,
  },
  {
    name: "Sarah Khan",
    location: "London",
    text: `I travel frequently for work, and parking has always been one of those small but constant headaches. Comparing options across different websites, worrying about security, and not knowing if I was getting a fair price — it all added up.

What I love about this platform is how simple and transparent everything is. Within seconds, I can see all available options, compare prices, and choose what works best for me. The booking process is incredibly straightforward, and the confirmations give me confidence that everything is taken care of.

The biggest difference for me is peace of mind. I no longer second-guess my choices or worry about last-minute issues. It just works — and that’s exactly what you want when you’re traveling.`,
  },
  {
    name: "James Carter",
    location: "Manchester",
    text: `Before using this, airport parking always felt like a gamble. Sometimes I’d overpay, other times I’d end up far from the terminal with confusing directions. It was never a consistent experience.

This platform changed that completely. The ability to compare multiple providers in one place is a game changer. I can clearly see pricing, distance, and features, and make a decision in minutes instead of spending hours researching.

What impressed me most is how reliable everything has been. Every booking I’ve made has gone smoothly, and the service has been exactly as described each time. It’s made my travel routine far more efficient and a lot less stressful.

At this point, I wouldn’t go back to doing it the old way. This just makes too much sense.`,
  },
  {
    name: "Milon Zahino",
    location: "Birmingham",
    text: `Driving around, wasting time, hoping to find a spot — it used to be one of the most frustrating parts of my trips. I’d leave early just to account for parking uncertainty, and even then, I’d sometimes end up stressed before my journey even began.

Since I started using this service, that entire experience has completely changed. I can search, compare, and reserve a space in seconds, and I know exactly where I’m going before I even leave home. When I arrive, everything is exactly as expected — no surprises, no confusion.

It’s honestly saved me a huge amount of time and mental energy. What used to feel like chaos is now a smooth, predictable part of my routine. I didn’t realize how much I needed this until I started using it.`,
  },
  {
    name: "Sarah Khan",
    location: "London",
    text: `I travel frequently for work, and parking has always been one of those small but constant headaches. Comparing options across different websites, worrying about security, and not knowing if I was getting a fair price — it all added up.

What I love about this platform is how simple and transparent everything is. Within seconds, I can see all available options, compare prices, and choose what works best for me. The booking process is incredibly straightforward, and the confirmations give me confidence that everything is taken care of.

The biggest difference for me is peace of mind. I no longer second-guess my choices or worry about last-minute issues. It just works — and that’s exactly what you want when you’re traveling.`,
  },
  {
    name: "James Carter",
    location: "Manchester",
    text: `Before using this, airport parking always felt like a gamble. Sometimes I’d overpay, other times I’d end up far from the terminal with confusing directions. It was never a consistent experience.

This platform changed that completely. The ability to compare multiple providers in one place is a game changer. I can clearly see pricing, distance, and features, and make a decision in minutes instead of spending hours researching.

What impressed me most is how reliable everything has been. Every booking I’ve made has gone smoothly, and the service has been exactly as described each time. It’s made my travel routine far more efficient and a lot less stressful.

At this point, I wouldn’t go back to doing it the old way. This just makes too much sense.`,
  },
];

const faqs = [
  {
    q: "Is my car safe at your facility?",
    a: "Yes, our facility is monitored 24/7 with HD CCTV cameras, secure gated access, and professional on-site staff patrolling the area constantly.",
  },
  {
    q: "How far is the parking from the terminal?",
    a: "Our parking locations are within minutes of the terminal with quick shuttle or valet services available.",
  },
  {
    q: "Can I cancel my booking?",
    a: "Yes, cancellations are supported depending on your selected plan.",
  },
  {
    q: "Do you offer Meet & Greet parking?",
    a: "Yes, we provide convenient Meet & Greet services.",
  },
  {
    q: "What happens if my flight is delayed?",
    a: "We monitor flights and adjust bookings accordingly.",
  },
  {
    q: "Are there any hidden fees?",
    a: "No. Fully transparent pricing.",
  },
];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const getItemVariant = (i: number) => ({
  hidden: {
    opacity: 0,
    x: i % 2 === 0 ? -80 : 80, // alternate left/right
  },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
});

// const variants = {
//   active: {
//     rotateY: 0,
//     x: 0,
//     y: 0,
//     scale: 1,
//     opacity: 1,
//     zIndex: 30,
//   },
//   next: {
//     rotateY: -20,
//     x: 60,
//     y: 20,
//     scale: 0.95,
//     opacity: 0.7,
//     zIndex: 20,
//   },
//   prev: {
//     rotateY: 20,
//     x: -60,
//     y: 20,
//     scale: 0.95,
//     opacity: 0.7,
//     zIndex: 20,
//   },
//   hidden: {
//     rotateY: 0,
//     x: 0,
//     y: 40,
//     scale: 0.9,
//     opacity: 0,
//     zIndex: 0,
//   },
// };
// const variants = {
//   // active: (direction: number) => ({
//   //   rotateY: 0,
//   //   x: 0,
//   //   y: 0,
//   //   scale: 1,
//   //   opacity: 1,
//   //   zIndex: 30,
//   //   transition: { duration: 0.6, ease: "easeInOut" },
//   // }),
//   active: (direction: number) => ({
//     rotateY: 0,
//     x: 0,
//     y: 0,
//     scale: 1,
//     opacity: 1,
//     zIndex: 30,
//     transition: {
//       duration: 0.6,
//       ease: [0.22, 1, 0.36, 1] as const, // smoother cinematic curve
//     },
//   }),

//   next: (direction: number) => ({
//     rotateY: -15,
//     x: 40,
//     y: 20,
//     scale: 0.96,
//     opacity: 0.7,
//     zIndex: 20,
//   }),

//   prev: (direction: number) => ({
//     rotateY: 15,
//     x: -40,
//     y: 20,
//     scale: 0.96,
//     opacity: 0.7,
//     zIndex: 20,
//   }),

//   hidden: (direction: number) => ({
//     rotateY: direction > 0 ? -60 : 60,
//     x: direction > 0 ? 120 : -120,
//     y: 40,
//     scale: 0.9,
//     opacity: 0,
//     zIndex: 0,
//   }),
// };
const variants = {
  position: (pos: number) => {
    const abs = Math.abs(pos);
    const CARD_WIDTH = 420;
    const EDGE = 10;
    // const SHIFT = 200;
    const SHIFT = 50;

    return {
      //      x:
      // pos === 0
      //   ? 0
      //   : pos > 0
      //   ? CARD_WIDTH - EDGE
      //   : -(CARD_WIDTH - EDGE),
      x: pos * SHIFT,
      y: abs === 0 ? 0 : 40,
      scale: pos === 0 ? 1 : abs === 1 ? 0.95 : 0.9,
      rotateY: pos === 0 ? 0 : pos > 0 ? -20 : 20,
      // rotateY: pos === 0 ? 0 : pos > 0 ? -35 : 35,
      opacity: abs > 2 ? 0 : 1,
      zIndex: 30 - abs,
      filter: abs === 0 ? "none" : "blur(1px)",
      transition: {
        type: "spring" as const,
        stiffness: 120,
        damping: 18,
      },
    };
  },
};

const parallaxPanelClass = "";

type Feature = (typeof features)[number];

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const duration = 2000;
    const startTime = performance.now();
    let raf: number;
    const update = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) {
        raf = requestAnimationFrame(update);
      } else {
        setCount(value);
      }
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [started, value]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;

  return (
    <div
      className={`relative rounded-3xl p-8 lg:p-6 transition-all duration-300 shadow-2xl
        ${
          feature.primary
            ? "bg-primary text-white border-primary dark:bg-white/8 "
            : "bg-white/60 dark:bg-slate-900  backdrop-blur-md dark:backdrop-blur-sm border border-primary/30 dark:border-white/15 text-primary dark:text-white"
        }
        `}
    >
      {feature.primary && (
        <div className="absolute inset-0 rounded-3xl bg-primary blur-2xl opacity-30 -z-10 animate-pulse dark:hidden" />
      )}

      <div className="mb-6">
        <Icon className="w-8 h-8 dark:text-white" />
      </div>

      <h3 className="text-xl font-semibold mb-3 dark:text-white">
        {feature.title}
      </h3>
      <p className="dark:text-white font-light">{feature.desc}</p>
    </div>
  );
}

// ─── Parallax Banner ──────────────────────────────────────────────────────────
// background-attachment:fixed keeps the image pinned to the viewport while
// ALL child sections scroll past it. Works for every section inside, not
// just the first. iOS Safari falls back to a static cover (acceptable).
// No sticky / absolute / z-index tricks needed — the browser handles it.
function ParallaxSection({
  image,
  children,
}: {
  image: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundImage: `url('${image}')`,
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CompareHeathrowParking() {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const stickyRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);

  const [dropOff, setDropOff] = useState("");
  const [pickUp, setPickUp] = useState("");
  const [searchError, setSearchError] = useState("");
  const [tiers, setTiers] = useState<BusinessTier[]>([]);
  const [tiersLoading, setTiersLoading] = useState(true);
  const [tiersError, setTiersError] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  // single-business price state
  const [price, setPrice] = useState<PriceState>({
    startingPrice: null,
    totalPrice: null,
    totalDays: null,
    loading: true,
  });

  // const next = () => {
  //   setDirection(1);
  //   setIndex((prev) => (prev + 1) % reviews.length);
  // };

  // const prev = () => {
  //   setDirection(-1);
  //   setIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  // };
  const next = () => {
    setIndex((prev) => (prev + 1) % reviews.length);
  };

  const prev = () => {
    setIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const review = reviews[index];

  useEffect(() => {
    const canvas = canvasRef.current!;
    const context = canvas.getContext("2d")!;

    const frameCount = 107; // your total frames

    const currentFrame = (index: number) =>
      `/scroll-trigger-animation/ezgif-frame-${String(index).padStart(3, "0")}.jpg`;

    const images: HTMLImageElement[] = [];
    const imageSeq = { frame: 0 };

    // Preload images
    for (let i = 1; i <= frameCount; i++) {
      const img = new window.Image();
      img.src = currentFrame(i);
      images.push(img);
    }

    const render = () => {
      const img = images[imageSeq.frame];
      if (!img) return;

      const { width, height } = canvas;

      context.clearRect(0, 0, width, height);

      // Cover behavior (like object-cover)
      const scale = Math.max(width / img.width, height / img.height);

      const x = (width - img.width * scale) / 2;
      const y = (height - img.height * scale) / 2;

      context.drawImage(img, x, y, img.width * scale, img.height * scale);
    };

    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      render();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Scroll animation
    gsap.to(imageSeq, {
      frame: frameCount - 1,
      snap: "frame",
      ease: "none",
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: `+=${frameCount * 20}`,
        scrub: true,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
      onUpdate: render,
    });

    images[0].onload = render;

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  useEffect(() => {
    const sticky = stickyRef.current;
    const card1 = card1Ref.current;
    const card2 = card2Ref.current;
    const card3 = card3Ref.current;
    if (!sticky || !card1 || !card2 || !card3) return;

    const mm = gsap.matchMedia();

    // ── DESKTOP: pin + slide from right ──────────────────────────────
    mm.add("(min-width: 768px)", () => {
      gsap.set([card1, card2], { x: "80%", autoAlpha: 0 });
      gsap.set(card3, { y: 60, autoAlpha: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sticky,
          start: "top top",
          end: "+=2000",
          scrub: 1,
          pin: true,
          pinSpacing: true,
        },
      });

      tl.to(
        card1,
        { x: "0%", autoAlpha: 1, ease: "power2.out", duration: 0.3 },
        0,
      )
        .to(
          card2,
          { x: "0%", autoAlpha: 1, ease: "power2.out", duration: 0.3 },
          0.3,
        )
        .to(
          card3,
          { y: 0, autoAlpha: 1, ease: "power2.out", duration: 0.25 },
          0.6,
        )
        .to({}, { duration: 0.15 });

      return () => ScrollTrigger.getAll().forEach((t) => t.kill());
    });

    // ── MOBILE: no pin, each card fades up as it enters viewport ─────
    mm.add("(max-width: 767px)", () => {
      gsap.set([card1, card2, card3], { y: 40, autoAlpha: 0 });

      [card1, card2, card3].forEach((card) => {
        gsap.to(card, {
          y: 0,
          autoAlpha: 1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        });
      });

      return () => ScrollTrigger.getAll().forEach((t) => t.kill());
    });

    return () => mm.revert(); // cleans up both contexts + all ScrollTriggers
  }, []);

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

  const handleQuickBook = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (startDate && endDate) {
      router.push(
        `/pricing?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`,
      );
    } else {
      router.push("/pricing");
    }
  };

  //   const getPosition = (i: number) => {
  //   if (i === index) return "active";
  //   if (i === (index + 1) % reviews.length) return "next";
  //   if (i === (index - 1 + reviews.length) % reviews.length) return "prev";
  //   return "hidden";
  // };
  const getPosition = (i: number) => {
    if (i === index) return "active";
    if (i === (index + 1) % reviews.length) return "next";
    if (i === (index - 1 + reviews.length) % reviews.length) return "prev";
    return "hidden";
  };

  return (
    <div className="min-h-screen bg-background page-bg overflow-x-hidden">
      {/* <section
        ref={heroRef}
        className="relative w-full min-h-[100svh] sm:min-h-[100svh] lg:min-h-screen overflow-hidden"
      > */}
      <section
        ref={heroRef}
        className="relative w-full min-h-[100svh] overflow-visible z-20"
      >
        {/* Background: canvas + overlay + bottom fade */}
        <div className="absolute inset-0">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover -z-10"
          />
          <div className="absolute inset-0 bg-black/50" />
          {/* <div className="absolute bottom-0 left-0 w-full h-32 sm:h-40 lg:h-52 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" /> */}
          <div className="absolute bottom-0 left-0 w-full h-48 sm:h-64 lg:h-80 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
        </div>

        {/* Content: title at top, search anchored to bottom */}
        <div className="relative z-10 h-full flex flex-col justify-between max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-10 pt-20 sm:pt-24 md:pt-40 pb-20 sm:pb-24 lg:pb-28">
          {/* Title block */}
          <div className="max-w-2xl text-center sm:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-tight text-white mb-3 sm:mb-2 font-zuume"
            >
              Parking, Made Effortless
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="text-white/90 text-sm sm:text-base md:text-lg leading-relaxed max-w-md"
            >
              Find, reserve, and manage parking spaces instantly — anywhere,
              anytime.
            </motion.p>
          </div>

          {/* Search form — anchored to bottom of hero */}
          <div
            id="search"
            className="w-full relative translate-y-[30%] sm:translate-y-[40%] lg:translate-y-1/2 z-30"
          >
            <div className="relative w-full max-w-7xl ">
              <div className="absolute -top-9 left-0 px-4 py-2 rounded-t-xl bg-white/10 backdrop-blur-xl border border-b-0 border-white/30 text-white text-sm font-semibold">
                PreBooking
              </div>

              <Card className="w-full border border-white/20 backdrop-blur-md bg-white/5 shadow-2xl rounded-xl rounded-tl-none">
                <CardContent className="p-4 sm:p-6">
                  <form onSubmit={handleQuickBook}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
                      <div>
                        <Label className="text-sm font-medium text-white mb-2 block">
                          Select Airport
                        </Label>
                        <AirportPopover homepage/>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-white mb-2 block">
                          Drop-off Date &amp; Time
                        </Label>
                        <DateTimePicker
                          value={startDate}
                          onChange={(val) => {
                            setSearchError("");
                            setStartDate(val);
                          }}
                          homepage
                        />
                      </div>
                      <div className="sm:col-span-2 lg:col-span-1">
                        <Label className="text-sm font-medium text-white mb-2 block">
                          Pick-up Date &amp; Time
                        </Label>
                        <DateTimePicker
                          value={endDate}
                          onChange={(val) => {
                            setSearchError("");
                            setEndDate(val);
                          }}
                          homepage
                        />
                      </div>
                    </div>
                    <Button className="bg-primary w-full text-base font-semibold h-14 hover:bg-white hover:text-primary">
                      Book Now
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={sectionRef}
        className="relative overflow-visible bg-background"
      >
        <div
          ref={stickyRef}
          className="min-h-screen md:h-screen flex items-center justify-center overflow-visible py-16 md:py-0"
        >
          <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-4 px-4 sm:px-8 lg:px-10">
            <div ref={card1Ref} className="lg:col-span-2">
              <FeatureCard feature={features[0]} />
            </div>
            <div ref={card2Ref}>
              <FeatureCard feature={features[1]} />
            </div>
            <div ref={card3Ref}>
              <FeatureCard feature={features[2]} />
            </div>
          </div>
        </div>
      </section>

      <ParallaxSection
        image={`${theme === "dark" ? "/dark_parallex1.png" : "/parallex1.png"}`}
      >
        <section className="relative z-10 px-4 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
          {/* Background image (right side fade) */}
          {/* <div className="absolute inset-0">
            <img
              src="/car-bg.png" // replace with your image
              alt="Background"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent" />
          </div> */}

          {/* Content */}
          <div
            className={`relative z-10 max-w-7xl mx-auto px-6 py-8 sm:px-10 sm:pt-10 sm:pb-2 lg:px-1 ${parallaxPanelClass}`}
          >
            {/* Heading */}
            <h2 className="font-bold tracking-tight mb-6">
              <span className="text-4xl sm:text-7xl text-primaryblue dark:text-white font-extrabold font-zuume">
                ABOUT PARK
              </span>
              <span className="text-4xl sm:text-5xl text-primaryblue font-normal dark:text-white">
                ease
              </span>
            </h2>

            {/* Intro text */}
            <p className="max-w-2xl text-primary  leading-relaxed mb-10 dark:text-white">
              ParkEase Parking Limited is a modern parking management company
              dedicated to simplifying the parking experience across UK. With
              our smart technology and user-first approach, we eliminate parking
              stress for both vehicle owners and lot managers.
            </p>

            {/* Content block */}
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
              {/* Image (fixed size, not flexible) */}
              <div className="flex-shrink-0">
                <Image
                  src="/parking.svg"
                  alt="Parking"
                  width={240}
                  height={140}
                  className="object-cover rounded-xl shadow-md"
                />
              </div>

              {/* Text */}
              <div className="flex-1">
                <h3 className="text-2xl font-semibold text-primary dark:text-white mb-3">
                  We Are Here For Help
                </h3>

                <p className="text-primary dark:text-white leading-relaxed">
                  Founded with the vision to create smarter cities, ParkEase
                  Parking Limited was born out of a simple observation: parking
                  needs to be modernized. What began as a small tech experiment
                  has now grown into a full-fledged multi-city parking network,
                  trusted by thousands of users. From bustling metro areas to
                  commercial complexes and residential societies, our platform
                  is being adopted across many cities to streamline parking
                  experiences for both users and operators.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 px-4 sm:px-8 lg:px-10 ">
          <div
            className={`max-w-7xl mx-auto px-6 py-6 sm:px-1 sm:py-8  ${parallaxPanelClass}`}
          >
            <div className="flex sm:flex-row flex-col justify-between gap-10 text-center py-10 border-t">
              <div>
                <h3 className="text-4xl sm:text-5xl font-bold text-primaryblue dark:text-white mb-2">
                  <Counter value={25400} suffix="+" />
                </h3>
                <p className="text-sm tracking-widest text-primaryblue dark:text-white uppercase">
                  Premium Spots Managed
                </p>
              </div>

              <div>
                <h3 className="text-4xl sm:text-5xl font-bold text-primaryblue dark:text-white mb-2">
                  <Counter value={10} suffix="+" />
                </h3>
                <p className="text-sm tracking-widest text-primaryblue dark:text-white uppercase">
                  Years Experience
                </p>
              </div>

              <div>
                <h3 className="text-4xl sm:text-5xl font-bold text-primaryblue dark:text-white mb-2">
                  <Counter value={100} suffix="%" />
                </h3>
                <p className="text-sm tracking-widest text-primaryblue dark:text-white uppercase">
                  User Satisfaction
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── PARALLAX 1: About Us → Pricing ─────────────────────────────────── */}
        {/* <ParallaxBanner src="/parallex1.png" fromColor="#ffffff" toColor="#ffffff" /> */}

        <section className="relative z-10 px-4 py-6 sm:px-8 sm:py-8 lg:px-16 lg:pb-20">
          <div
            className={`mx-auto max-w-7xl px-6 py-10 sm:px-10 sm:py-12 lg:px-12 ${parallaxPanelClass}`}
          >
            <h2 className="text-4xl sm:text-7xl text-primaryblue text-center font-extrabold font-zuume dark:text-white">
              Daily Pricing
            </h2>
            <p className="text-center text-primaryblue/60 mb-8 dark:text-white font-light">
              Prices may vary based on duration and season
            </p>

            {/* Loading skeletons */}
            {tiersLoading && (
              <div className="mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-border bg-white/60 backdrop-blur-xl p-6 animate-pulse"
                  >
                    <div className="h-5 w-2/3 bg-muted rounded mb-3" />
                    <div className="h-3 w-full bg-muted rounded mb-1" />
                    <div className="h-3 w-4/5 bg-muted rounded mb-6" />
                    <div className="h-8 w-1/2 bg-muted rounded mb-6" />
                    <div className="space-y-2">
                      {[0, 1, 2].map((j) => (
                        <div key={j} className="h-3 w-full bg-muted rounded" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error state */}
            {!tiersLoading && tiersError && (
              <p className="text-center text-muted-foreground py-10">
                Unable to load pricing at this time. Please try again later.
              </p>
            )}

            {/* Empty state */}
            {!tiersLoading && !tiersError && tiers.length === 0 && (
              <p className="text-center text-muted-foreground py-10">
                No pricing tiers available yet.
              </p>
            )}

            {/* Tier cards */}
            {!tiersLoading && !tiersError && tiers.length > 0 && (
              <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                className={`mx-auto grid gap-6 ${
                  tiers.length === 1
                    ? "max-w-sm"
                    : tiers.length === 2
                      ? "sm:grid-cols-2 max-w-3xl"
                      : "sm:grid-cols-2 lg:grid-cols-3 max-w-6xl"
                }`}
              >
                {tiers.map((tier: BusinessTier, i: number) => (
                  <motion.div
                    key={tier._id}
                    variants={getItemVariant(i)}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="h-full"
                  >
                    <Card className="h-full flex flex-col rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-white/6 backdrop-blur-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:border-primary/40 overflow-hidden">
                      {/* Coloured top bar */}
                      <div className="h-1.5 w-full bg-gradient-to-r from-primary to-primaryblue" />

                      <CardHeader className="p-6 pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-xl font-bold text-primaryblue  dark:text-white">
                            {tier.name}
                          </CardTitle>
                          {i === 1 && tiers.length >= 3 && (
                            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider bg-primary text-white px-2 py-0.5 rounded-full">
                              Popular
                            </span>
                          )}
                        </div>

                        {tier.description && (
                          <CardDescription className="text-sm mt-1 leading-relaxed">
                            {tier.description}
                          </CardDescription>
                        )}

                        {/* Price badge */}
                        <div className="mt-5 flex items-end gap-1">
                          <span className="text-3xl font-extrabold text-primaryblue leading-none dark:text-white">
                            {formatPrice(tier.firstTenDayPrices[0] ?? 0)}
                          </span>
                          <span className="text-sm text-muted-foreground mb-0.5 ">
                            /day
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Starting price
                        </p>
                      </CardHeader>

                      <div className="mx-6 border-t border-border/60" />

                      <CardContent className="px-6 py-5 flex flex-col flex-1">
                        {tier.features.length > 0 && (
                          <ul className="space-y-2.5 flex-1">
                            {tier.features.map((f: string, idx: number) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2.5 text-sm"
                              >
                                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500 dark:text-primaryblue" />
                                <span className="text-foreground leading-snug">
                                  {f}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}

                        <Button
                          onClick={handleQuickBook}
                          className="mt-6 w-full rounded-xl hover:bg-primaryblue hover:text-white"
                          variant={
                            i === 1 && tiers.length >= 3 ? "default" : "outline"
                          }
                        >
                          Book Now
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>
      </ParallaxSection>

      <ParallaxSection
        image={`${theme === "dark" ? "/dark_parallex2.png" : "/parallex2.png"}`}
      >
        <section className="relative z-10 px-4 py-14 sm:px-8 sm:py-16 lg:px-16 lg:py-20">
          <div
            className={`max-w-5xl mx-auto px-6 py-8 sm:px-10 sm:py-10 lg:px-12 ${parallaxPanelClass}`}
          >
            {/* Heading */}
            <h2 className="text-4xl sm:text-6xl text-primaryblue text-center font-extrabold font-zuume mb-4 dark:text-white">
              FREQUENTLY ASKED QUESTIONS
            </h2>

            <p className="text-center text-primaryblue/60 mb-10 dark:text-white font-light">
              Everything you need to know about parking with us.
            </p>

            {/* FAQ List */}
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="flex flex-col gap-4 max-w-xl mx-auto"
            >
              {faqs.map((itemData, i) => {
                const isOpen = openFaq === i;

                return (
                  <motion.div
                    key={i}
                    variants={item}
                    whileHover={{ y: -3 }}
                    className={`
                  rounded-2xl border transition-all duration-300 bg-white
                  ${
                    isOpen
                      ? "border-primaryblue  shadow-md"
                      : "border-gray-200/80  hover:bg-white"
                  }
                `}
                  >
                    {/* Question */}
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between px-6 py-5 text-left"
                    >
                      <span className="font-semibold text-primaryblue text-base sm:text-lg pr-4 dark:text-primary">
                        {itemData.q}
                      </span>

                      {/* Icon animation */}
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 15,
                        }}
                      >
                        <ChevronDown className="w-5 h-5 text-primaryblue/60 dark:text-primary" />
                      </motion.div>
                    </button>

                    {/* Answer animation */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            height: { duration: 0.35 },
                            opacity: { duration: 0.25 },
                          }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5">
                            <p className="text-sm text-gray-600  leading-relaxed dark:text-primary">
                              {itemData.a}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
        <section className="relative z-10 px-4 py-6 sm:px-8 sm:py-8 lg:px-2">
          <div
            className={`max-w-7xl mx-auto px-6 py-8 sm:px-10 sm:py-10 lg:px-10 ${parallaxPanelClass}`}
          >
            <div className="grid lg:grid-cols-2  gap-10 items-center">
              {/* LEFT SIDE */}
              <div>
                <h2 className="text-4xl sm:text-6xl font-extrabold text-primaryblue font-zuume mb-4 dark:text-white">
                  WHAT OUR USERS SAY
                </h2>

                <p className="text-primaryblue/70 mb-8 max-w-md dark:text-white font-light">
                  From effortless booking to seamless arrival, our users share
                  how we’ve transformed everyday parking into a smooth
                  experience.
                </p>

                <div className="relative rounded-3xl overflow-hidden">
                  {/* Background */}
                  <img
                    src="/reviews.svg"
                    className="w-full h-56 sm:h-64 object-cover"
                    alt=""
                  />

                  {/* Dark overlay */}

                  {/* Inner border (this is key 🔥) */}
                  <div className="absolute inset-3 rounded-2xl border border-white/30 pointer-events-none" />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 sm:px-10">
                    {/* Heading */}
                    <p className="text-white font-semibold text-lg sm:text-2xl leading-snug mb-6 max-w-xl">
                      Ready to park without the hassle?
                      <br />
                      Find your spot in seconds.
                    </p>

                    {/* Button */}
                    <button className="w-full max-w-md bg-white text-primary font-semibold py-3 rounded-full shadow-lg hover:bg-white/90 transition">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
              <div className="w-full flex justify-center items-center py-20">
                <div className="relative h-[420px] sm:h-[460px] w-[250px] sm:w-[420px] perspective-[3000px] sm:perspective-[2500px]">
                      {/* <div className="absolute inset-0 overflow-hidden px-[40px]"> */}
                  {reviews.map((review, i) => {
                    const offset =
                      (i - index + reviews.length) % reviews.length;

                    const pos =
                      offset > reviews.length / 2
                        ? offset - reviews.length
                        : offset;

                    if (Math.abs(pos) > 2) return null;

                    return (
                      <motion.div
                        key={i}
                        custom={pos}
                        variants={variants}
                        animate="position"
                        initial={false}
                        className={cn(
                          "absolute w-full h-full rounded-3xl bg-[#f9fbfb] p-8 flex flex-col justify-between",
                          pos === 0
                            ? "shadow-[0_25px_80px_rgba(0,0,0,0.2)]"
                            : "shadow-[0_10px_30px_rgba(0,0,0,0.08)]",
                        )}
                        style={{
                          transformStyle: "preserve-3d",
                        }}
                      >
                        {/* Big Quote */}
                        <div className="absolute top-10 right-10 text-[120px] text-gray-200 font-serif leading-none pointer-events-none">
                          ”
                        </div>

                        {/* Counter */}
                        <div className="bg-primary/90 text-white text-xs px-5 py-2 rounded-full w-fit">
                          {i + 1} of {reviews.length}
                        </div>

                        {/* Text */}
                        <p className="text-gray-700 text-[15px] leading-relaxed mt-6 max-w-[90%] line-clamp-6">
                          {review.text}
                        </p>

                        {/* Stars + Nav */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <Star
                                key={j}
                                className="w-5 h-5 text-yellow-500 fill-yellow-500"
                              />
                            ))}
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={prev}
                              className="p-2 rounded-full hover:bg-gray-200 transition"
                            >
                              <ChevronLeft className="w-5 h-5 dark:text-primary" />
                            </button>
                            <button
                              onClick={next}
                              className="p-2 rounded-full hover:bg-gray-200 transition"
                            >
                              <ChevronRight className="w-5 h-5 dark:text-primary" />
                            </button>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-200 mt-4" />

                        {/* User */}
                        <div className="flex items-center gap-3 mt-4">
                          <img
                            src={`https://i.pravatar.cc/100?img=${i + 10}`}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-semibold text-sm text-gray-800">
                              {review.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {review.location}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div></div>
              {/* </div> */}
              {/* <div className="relative h-[420px] sm:h-[460px] perspective">
                {reviews.map((review, i) => {
                  const position = getPosition(i);

                  return (
                    // <motion.div
                    //   key={i}
                    //   variants={variants}
                    //   animate={position}
                    //   transition={{ duration: 0.6, ease: "easeInOut" }}
                    //   className="absolute w-full h-full bg-[#f9fbfb] dark:bg-white-800 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-8 flex flex-col justify-between"
                    //   style={{ transformStyle: "preserve-3d" }}
                    // >
                    <motion.div
                      key={i}
                      custom={direction}
                      variants={variants}
                      animate={position}
                      initial="hidden"
                      // className="absolute w-full h-full rounded-3xl bg-[#f9fbfb] shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-8 flex flex-col justify-between"
                      className={cn(
                        "absolute w-full h-full rounded-3xl transition-shadow bg-[#f9fbfb]",
                        position === "active"
                          ? "shadow-[0_25px_80px_rgba(0,0,0,0.2)]"
                          : "shadow-[0_10px_30px_rgba(0,0,0,0.08)]",
                      )}
                      style={{
                        transformStyle: "preserve-3d",
                        transformOrigin:
                          direction > 0 ? "right center" : "left center",
                        filter: position !== "active" ? "blur(0.5px)" : "none",
                      }}
                    >

                      <div className="absolute top-10 right-10 text-[120px] text-gray-200 dark:text-primary/10 font-serif leading-none pointer-events-none">
                        ”
                      </div>

                      <div className="bg-primary/90 text-white text-xs px-5 py-2 rounded-full w-fit">
                        {i + 1} of {reviews.length}
                      </div>

                      <p className="text-gray-700 dark:text-black text-[15px] leading-relaxed mt-6 max-w-[90%] line-clamp-9">
                        {review.text}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star
                              key={j}
                              className="w-5 h-5 text-yellow-500 fill-yellow-500"
                            />
                          ))}
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={prev}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={next}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 dark:border-slate-600 mt-4" />

                      <div className="flex items-center gap-3 mt-4">
                        <img
                          src={`https://i.pravatar.cc/100?img=${i + 10}`}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-semibold text-sm text-gray-800">
                            {review.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {review.location}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div> */}
              {/* <div className="relative h-[420px] sm:h-[460px] perspective">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={index}
                    initial={{ rotateY: direction > 0 ? 90 : -90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: direction > 0 ? -90 : 90, opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="absolute w-full h-full bg-[#f9fbfb] dark:bg-white-800 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-8 flex flex-col justify-between"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    Quote Icon (background)
                    <div className="absolute top-10 right-10 text-[120px] text-gray-200 dark:text-primary/10 font-serif leading-none pointer-events-none">
                      ”
                    </div>

                    Badge
                    <div className="bg-primary/90 text-white text-xs px-5 py-2 rounded-full w-fit">
                      {index + 1} of {reviews.length}
                    </div>

                    Text
                    <p className="text-gray-700 dark:text-black text-[15px] leading-relaxed mt-6 max-w-[90%] line-clamp-9">
                      {review.text}
                    </p>

                    Stars + arrows row
                    <div className="flex items-center justify-between mt-2">
                       Stars 
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className="w-5 h-5 text-yellow-500 fill-yellow-500"
                          />
                        ))}
                      </div>

                      Controls
                      <div className="flex items-center gap-3">
                        <button
                          onClick={prev}
                          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition dark:text-black"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={next}
                          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition dark:text-black"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    Divider
                    <div className="border-t border-gray-200 dark:border-slate-600 mt-4" />

                    Footer
                    <div className="flex items-center gap-3 mt-4">
                      <img
                        src={`https://i.pravatar.cc/100?img=${index + 10}`}
                        className="w-10 h-10 rounded-full"
                        alt={`${review.name} avatar`}
                      />
                      <div>
                        <p className="font-semibold text-sm text-gray-800 dark:text-black-100">
                          {review.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-black-400">
                          {review.location}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                BACKGROUND STACKED CARDS
                Card 2
                <div className="absolute inset-0 -z-10 transform translate-x-6 translate-y-4 rotate-[3deg] scale-[0.98] rounded-3xl bg-gray-100 dark:bg-white-700 shadow-[0_15px_40px_rgba(0,0,0,0.08)] opacity-80" />

                Card 3
                <div className="absolute inset-0 -z-20 transform translate-x-10 translate-y-8 rotate-[6deg] scale-[0.96] rounded-3xl bg-gray-200 dark:bg-white-600 shadow-[0_10px_30px_rgba(0,0,0,0.06)] opacity-60" />
              </div> */}
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ─────────────────────────────────────────────────────── */}
        <section className="relative z-10 py-10 px-4 sm:px-8 sm:py-14 lg:px-10">
          <div className="max-w-7xl mx-auto relative rounded-[2rem] overflow-hidden">
            {/* Background Image */}
            <Image
              src="/cta.svg" // replace with your image
              alt=""
              fill
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/10" />

            {/* Glass container */}
            <div className="relative z-10 m-4 sm:m-6 rounded-[1.5rem] border border-white/20 bg-white/5 backdrop-blur-sm px-6 sm:px-12 py-10 sm:py-14 text-center">
              {/* Heading */}
              <h2 className="text-white font-bold text-2xl sm:text-4xl lg:text-5xl mb-4">
                Ready to Save on Airport Parking?
              </h2>

              {/* Subtext */}
              <p className="text-white/80 text-sm sm:text-base max-w-2xl mx-auto mb-8">
                Join millions of smart travellers who compare and book with
                Heathrow safe Parking. Enter your dates and let&apos;s find you
                the best deal.
              </p>

              {/* Input + Button */}
              <div className="mx-auto flex max-w-2xl flex-col gap-3 rounded-[1.75rem] bg-white/90 p-3 shadow-lg sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:p-2">
                {/* Input */}
                <div className="flex items-center flex-1 px-4">
                  <span className="text-gray-400 dark:text-slate-400 mr-2">
                    <Plane />
                  </span>
                  <input
                    type="text"
                    placeholder="Which airport?"
                    className="w-full bg-transparent outline-none text-gray-700 dark:text-slate-700 placeholder-gray-400 text-sm"
                  />
                </div>

                {/* Button */}
                <button className="w-full bg-primary text-white px-6 sm:px-8 py-3 rounded-full font-semibold text-sm sm:text-base hover:opacity-90 transition sm:w-auto">
                  Find Parking
                </button>
              </div>
            </div>
          </div>
        </section>
      </ParallaxSection>
    </div>
  );
}
