"use client";

import { useEffect, useState, useCallback } from "react";
import "./globals.css";
import FloatingEmojiBackground from "../components/FloatingEmojiBackground";

const THEMES = [
  { id: "retro",   label: "Retro Risograph" },
  { id: "carnival",label: "Midnight Carnival" },
];

export default function RootLayout({ children }) {
  const [theme, setTheme] = useState("retro");
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("emoji-heist-theme");
    if (saved === "retro" || saved === "carnival") {
      // Apply saved theme instantly on mount (no transition)
      document.documentElement.classList.remove("theme-retro", "theme-carnival");
      document.documentElement.classList.add(`theme-${saved}`);
      setTheme(saved);
    }
  }, []);

  const switchTheme = useCallback((newTheme) => {
    if (newTheme === theme) return;
    setTransitioning(true);
    // Brief fade to smooth out the variable swap
    requestAnimationFrame(() => {
      const html = document.documentElement;
      html.classList.remove("theme-retro", "theme-carnival");
      html.classList.add(`theme-${newTheme}`);
      localStorage.setItem("emoji-heist-theme", newTheme);
      setTheme(newTheme);
      // Remove transitioning flag after CSS transitions settle
      setTimeout(() => setTransitioning(false), 450);
    });
  }, [theme]);

  return (
    <html lang="en" suppressHydrationWarning className="theme-retro">
      <head>
        <title>Emoji Heist</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen relative">
        {/* Animated background layer */}
        <FloatingEmojiBackground />

        {/* Paper grain overlay – only visible when --grain-opacity > 0 (retro theme) */}
        <div className="grain-overlay" aria-hidden="true" />

        {/* Sticky header */}
        <header
          className="sticky top-0 z-40"
          style={{
            background: "color-mix(in srgb, var(--bg-card) 85%, transparent)",
            backdropFilter: "blur(10px)",
            borderBottom: "2px solid var(--border-light)",
            boxShadow: "0 2px 0 var(--border-light)",
          }}
        >
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <h1 className="text-xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              <span style={{ color: "var(--accent)" }}>Emoji</span> Heist
            </h1>

            {/* Theme toggle pills */}
            <div
              className="flex gap-1 p-1 rounded-xl"
              style={{ background: "var(--bg-surface)", border: "2px solid var(--border)" }}
            >
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => switchTheme(t.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={
                    theme === t.id
                      ? {
                          background: "var(--accent)",
                          color: "var(--bg-page)",
                          border: "1.5px solid var(--border)",
                          boxShadow: "var(--card-shadow-sm)",
                        }
                      : {
                          background: "transparent",
                          color: "var(--text-muted)",
                        }
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Page content sits above floating bg */}
        <main className="relative z-10 max-w-4xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
