"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const TOTAL_FRAMES = 24;

function getFramePath(index: number): string {
  const padded = String(index).padStart(3, "0");
  return `/scroll trigger animation/ezgif-frame-${padded}.jpg`;
}

export default function ScrollFrameHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const allLoaded = loadedCount === TOTAL_FRAMES;

  // Preload all frames
  useEffect(() => {
    const loaded: HTMLImageElement[] = [];
    let count = 0;

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFramePath(i);
      img.onload = () => {
        count++;
        setLoadedCount(count);
      };
      loaded.push(img);
    }

    setImages(loaded);
  }, []);

  // Scroll-linked frame index
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Map scroll progress [0, 1] → frame index [0, TOTAL_FRAMES - 1]
  const frameIndex = useTransform(
    scrollYProgress,
    [0, 1],
    [0, TOTAL_FRAMES - 1],
  );

  // Draw current frame on canvas
  useEffect(() => {
    if (!allLoaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match first image's natural size
    const firstImg = images[0];
    if (firstImg) {
      canvas.width = firstImg.naturalWidth;
      canvas.height = firstImg.naturalHeight;
    }

    const unsubscribe = frameIndex.on("change", (latest) => {
      const idx = Math.min(Math.max(Math.round(latest), 0), TOTAL_FRAMES - 1);
      const img = images[idx];
      if (img && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    });

    // Draw the initial frame
    const img = images[0];
    if (img) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    return () => unsubscribe();
  }, [allLoaded, images, frameIndex]);

  // Parallax on the text content
  const textY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: "200vh" }} // extra scroll room for scrubbing
    >
      {/* Sticky frame canvas */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Loading state */}
        {!allLoaded && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#1a1a2e]">
            <div className="relative w-48 h-1 rounded-full bg-white/10 overflow-hidden mb-4">
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)",
                  width: `${(loadedCount / TOTAL_FRAMES) * 100}%`,
                }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <p className="text-white/40 text-sm tracking-widest uppercase">
              Loading experience
            </p>
          </div>
        )}

        {/* Canvas background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: allLoaded ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40 z-[1]" />

        {/* Subtle vignette */}
        <div
          className="absolute inset-0 z-[2] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
          }}
        />

        {/* Bottom gradient fade to white */}
        <div className="absolute bottom-0 left-0 w-full h-48 z-[3] bg-gradient-to-b from-transparent to-white" />

        {/* Hero text content */}
        <motion.div
          className="absolute inset-0 z-10 flex items-center"
          style={{ y: textY, opacity: textOpacity }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 w-full">
            <div className="max-w-[600px]">
              {/* Pill badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white/90 text-xs tracking-wider uppercase font-medium font-zuume">
                  Parking, Made Effortless
                </span>
              </motion.div>

              {/* Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="font-bold text-4xl sm:text-5xl lg:text-[120px] lg:leading-[120px] tracking-tight text-white mb-4 font-zuume"
              >
                Parking, Made Effortless
              </motion.h1>

              {/* Subtext */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="text-white/80 text-base sm:text-lg leading-relaxed mb-8 max-w-[500px]"
              >
                Find, reserve, and manage parking spaces instantly — anywhere,
                anytime.
              </motion.p>

              {/* Scroll indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="flex items-center gap-3 mt-4"
              >
                <div className="w-[1px] h-10 bg-white/30 relative overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 w-full bg-white"
                    animate={{ height: ["0%", "100%", "0%"] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>
                <span className="text-white/40 text-xs tracking-[0.2em] uppercase">
                  Scroll to explore
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
