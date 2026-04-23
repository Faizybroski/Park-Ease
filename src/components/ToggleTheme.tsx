"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="px-2 py-2 rounded-full border dark:border-white dark:text-white text-primary border-primary dark:hover:bg-white/10 transition-colors hover:bg-primary hover:text-white"
    >
      {theme === "dark"? (<Sun />) :( <Moon/>)}
      
    </button>
  );
}