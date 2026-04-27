"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  const { theme } = useTheme();
  return (
    <footer className="relative text-gray-700 w-full">
      {/* All text content shares one container so left edges are identical */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10">
        {/* Top Section */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h2 className="font-bold text-lg mb-2">
              <Image
                src={`${theme === "dark" ? "/dark_logo.svg" : "/logo.svg"}`}
                alt="ParkEase"
                width={200}
                height={100}
              />
            </h2>
            <p className="text-sm mb-4 dark:text-white dark:opacity-70">
              The smartest way to find, reserve, and manage parking.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-foreground text-base mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/", label: "Home" },
                { href: "/book", label: "Book Parking" },
                { href: "/track", label: "Track Booking" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="opacity-70 hover:opacity-100 dark:text-white transition"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-foreground text-base mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/faqs", label: "FAQs" },
                { href: "/contact", label: "Contact Us" },
                { href: "/pricing", label: "Pricing" },
                { href: "/about", label: "About Us" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="opacity-70 hover:opacity-100 transition dark:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-foreground text-base mb-4">
              Contact Us
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 opacity-70 hover:opacity-100 transition">
                <a href="tel:07508624155" className="dark:text-white">
                  07508624155
                </a>
              </div>
              <div className="flex items-center gap-3 opacity-70 hover:opacity-100 transition">
                <a
                  href="mailto:parkeaseparking@gmail.com"
                  className="dark:text-white"
                >
                  parkeaseparking@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t dark:border-0 py-6 flex flex-col md:flex-row justify-between items-center text-sm dark:text-white">
          <p>
            © 2026 PARKEASE. BY{" "}
            <a
              href="https://thesocialnexus.co.uk"
              className="underline hover:opacity-100 transition"
            >
              The SOCIAL NEXUS
            </a>
            .
          </p>
        </div>
      </div>

      {/* Video Mask — full-width decorative element, flush to bottom */}
      <VideoMaskText />
    </footer>
  );
}

function VideoMaskText() {
  const { theme } = useTheme();
  return (
    // aspect-ratio drives the height responsively — no fixed h- needed
    <div
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: "1400 / 300" }}
    >
      {/* Video base layer */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="/8eb238de0f6244f016d78cafd97f914d_1_1775913666_5168.mp4"
      />

      {/* SVG mask — scales 1:1 with container via meet */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1400 300"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="text-mask">
            {/* White = show the rect (background colour) */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black = punch through to video beneath */}
            <text
              x="700"
              y="150"
              textAnchor="middle"
              dominantBaseline="middle"
              fontWeight="900"
              fontSize="265"
              letterSpacing="-6"
              fill="black"
              fontFamily="system-ui, sans-serif"
            >
              PARKEASE
            </text>
          </mask>
        </defs>

        {/* This rect gets cut by the text — video shows through letters */}
        <rect
          width="100%"
          height="100%"
          fill={`${theme === "dark" ? "#010e1a" : "#ffffff"}`}
          mask="url(#text-mask)"
        />
      </svg>
    </div>
  );
}
/* ---------------------------------- */
/* 🔥 SVG MASK VIDEO TEXT */
/* ---------------------------------- */
// function VideoMaskText() {
//   return (
//     <div className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden">
//       {/* <div className="relative w-full h-[200px] sm:h-[260px] md:h-[320px] lg:h-[420px]"> */}
//       {/* <div className="relative w-full h-[200px]"> */}
//       <div className="relative w-full h-[180px] md:h-[220px] lg:h-[260px]">
//         {/* ✅ VIDEO (base layer) */}
//         <video
//           autoPlay
//           muted
//           loop
//           playsInline
//           className="absolute inset-0 w-full h-full object-cover"
//           src="/8eb238de0f6244f016d78cafd97f914d_1_1775913666_5168.mp4"
//         />

//         {/* ✅ MASKED OVERLAY (this creates transparent text) */}
//         <svg
//           className="absolute inset-0 w-full h-full"
//           viewBox="0 0 1400 260"
//           preserveAspectRatio="xMidYMid slice"
//         >
//           <defs>
//             <mask id="text-mask">
//               {/* Everything hidden */}
//               <rect width="100%" height="100%" fill="white" />

//               {/* Text becomes "hole" */}
//               <text
//                 x="50%"
//                 y="55%"
//                 textAnchor="middle"
//                 dominantBaseline="middle"
//                 fontWeight="700"
//                 fontSize="280"
//                 letterSpacing="-15"
//                 fill="black"
//                 fontFamily="system-ui, sans-serif"
//               >
//                 PARKEASE
//               </text>
//             </mask>
//           </defs>

//           {/* Solid background that gets cut by text */}
//           <rect
//             width="100%"
//             height="100%"
//             fill="#f5f7f9"
//             mask="url(#text-mask)"
//           />
//         </svg>
//       </div>
//     </div>
//   );
// }
// function VideoMaskText() {
//   return (
//     <div className="absolute inset-0">
//       <svg
//         viewBox="0 0 1200 300"
//         className="w-full h-full"
//         preserveAspectRatio="xMidYMid slice"
//       >
//         <defs>
//           <mask id="text-mask">
//             {/* Background = hidden */}
//             <rect width="100%" height="100%" fill="black" />

//             {/* Text = visible */}
//             <text
//               x="50%"
//               y="55%"
//               textAnchor="middle"
//               fontSize="200"
//               fontWeight="900"
//               fill="white"
//               letterSpacing="-5"
//               fontFamily="sans-serif"
//             >
//               PARKEASE
//             </text>
//           </mask>
//         </defs>

//         {/* Video inside mask */}
//         <foreignObject width="100%" height="100%" mask="url(#text-mask)">
//           <video
//             autoPlay
//             muted
//             loop
//             playsInline
//             className="w-full h-full object-cover"
//             src="/8eb238de0f6244f016d78cafd97f914d_1_1775913666_5168.mp4"
//           />
//         </foreignObject>
//       </svg>
//     </div>
//   );
// }
