import type { Metadata } from "next";
import { ShieldCheck, Star, BadgeDollarSign } from "lucide-react";
import PageHero from "@/components/shared/PageHero";

export const metadata: Metadata = {
  title: "About Us - ParkEase",
  description: "Learn about ParkEase airport parking services.",
};

const items = [
  {
    icon: ShieldCheck,
    title: "24/7 Security",
    desc: "CCTV monitored with regular security patrols",
    color: "text-white",
    bg: "bg-gradient-to-br from-green-500 to-green-200",
  },
  {
    icon: Star,
    title: "50,000+ Happy Customers",
    desc: "Trusted by thousands of travellers every year",
    color: "text-white",
    bg: "bg-gradient-to-br from-yellow-500 to-yellow-200",
  },
  {
    icon: BadgeDollarSign,
    title: "Best Price Guarantee",
    desc: "Competitive rates with transparent pricing",
    color: "text-white",
    bg: "bg-gradient-to-br from-blue-500 to-blue-200",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <PageHero
        title="About ParkEase"
        subtitle="Your trusted airport parking partner"
      />
      <section className="py-16 max-w-4xl mx-auto px-4">
        <div className="space-y-8">
          <div className="rounded-2xl p-8 border bg-card border-primary/50  dark:bg-white/6 ring-0 shadow-lg hover:bg-primary/5">
            <h2 className="text-2xl font-bold mb-4 text-primary dark:text-primaryblue">
              Our Mission
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              At ParkEase, we believe airport parking should be simple,
              affordable, and stress-free. We provide secure, monitored
              parking spaces with a seamless online booking experience — no
              accounts, no hassle. Just book, park, and fly.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl p-6 text-center border border-primary/50 bg-card dark:bg-white/6  ring-0  shadow-lg hover:bg-primary/5 hover:scale-105 duration-300"
                >
                  <div
                    className={`w-14 h-14 mx-auto flex items-center justify-center rounded-xl mb-4 ${item.bg} transition`}
                  >
                    <Icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <h3 className="font-bold mb-2   dark:text-primaryblue text-primary">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl p-8 border bg-card border-primary/50  ring-0 dark:bg-white/6 shadow-lg hover:bg-primary/5 hover:scale-105 duration-300">
              <h2 className="text-xl font-bold mb-3 text-primary dark:text-primaryblue">
                Secure & Monitored
              </h2>
              <p className="leading-relaxed text-muted-foreground text-sm">
                Our facility operates around the clock with full CCTV
                coverage, controlled access gates, and regular security
                patrols — so your vehicle is always in safe hands while
                you travel.
              </p>
            </div>
            <div className="rounded-2xl p-8 border bg-card border-primary/50 ring-0 dark:bg-white/6 shadow-lg hover:bg-primary/5 hover:scale-105 duration-300">
              <h2 className="text-xl font-bold mb-3 text-primary dark:text-primaryblue">
                Hassle-Free Booking
              </h2>
              <p className="leading-relaxed text-muted-foreground text-sm">
                No accounts. No paperwork. Book online in under a minute,
                receive an instant confirmation with your unique tracking
                number, and manage your booking from anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
