"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="px-2 py-2 rounded-full border border-white text-white"
    >
      {theme === "dark"? (<Sun />) :( <Moon/>)}
      
    </button>
  );
}