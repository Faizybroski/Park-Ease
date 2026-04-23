"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import ThemeToggle from "@/components/ToggleTheme";
import { Menu, X, TextAlignStart } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/book", label: "Book Now" },
  { href: "/pricing", label: "Pricing" },
  { href: "/track", label: "Track Booking" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/faqs", label: "FAQs" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  return (
    // <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50 shadow-inner rounded-full overflow-hidden bg-white/40 bg-backdrop-lg w-6xl shadow-lg border border-white/20">
    <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-7xl w-[95%] shadow-inner rounded-full dark:bg-white/40 bg-white/50 dark:backdrop-blur-md backdrop-blur-lg dark:shadow-lg border dark:border-white/20 border-primary/50">
      {/* <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 h-20 flex items-center justify-between"> */}
      <div className="relative flex items-center justify-between h-16 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-white p-2 rounded-lg dark:hover:bg-white/10 transition-colors hover:bg-primary/10"
        >
          <span className="flex gap-2 font-normal dark:text-white text-primary">
            <span className="hidden lg:block">Menu</span>
            {isOpen ? (
              <X className="w-6 h-6" strokeWidth={3} />
            ) : (
              <TextAlignStart className="w-6 h-6" strokeWidth={3} />
            )}
          </span>
        </button>

        <div className="absolute left-1/2 -translate-x-1/2">
          <Link href="/">
            <Image src="/logo.svg" alt="Logo" width={130} height={40} />
          </Link>
        </div>
        {/* <Link href="/" className="flex items-center shrink-0">
          <Image src="/logo.svg" alt="Logo" width={150} height={40} />
        </Link> */}

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button>
            <Link
              href="/pricing"
              className="hidden lg:block bg-white text-primary text-sm font-bold px-6 py-2 rounded-full  hover:bg-primary/90 hover:text-white transition-colors border border-primary dark:border-0"
            >
              Book Now
            </Link>
          </button>
        </div>

        {isOpen && (
          <div
            className={`absolute top-[70px] z-50 left-1/2 -translate-x-1/2 max-w-6xl w-[95%] p-4 rounded-2xl border border-white/20 bg-white dark:bg-background backdrop-blur-xl shadow-lg transition-all duration-300 ease-in-out ${isOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-2 rounded-lg hover:bg-primary/40 transition-all duration-200 ${link.href === pathname ? "text-primary font-bold " : ""}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
        {/* Mobile hamburger */}
        {/* <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button> */}
      </div>

      {/* Mobile dropdown */}
      {/* {isOpen && (
        <div className="relative z-10 lg:hidden border-t border-white/10 animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className="text-white/90 text-sm font-medium px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                {label}
              </a>
            ))}
            <button>
              <Link
                href="/book"
                className="mt-2 bg-white text-primary text-sm font-bold px-6 py-3 rounded-full hover:bg-white/90 transition-colors w-full"
              >
                Compare Now
              </Link>
            </button>
          </div>
        </div>
      )} */}
    </nav>
  );
}
