"use client";

import { useMemo } from "react";

// Deterministic PRNG so server & client produce the same particles
function mkRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const ACCENT_EMOJIS = ["🕵️", "💎", "🔮", "🎯", "🃏", "🪄", "🏮"];

export default function FloatingEmojiBackground() {
  const particles = useMemo(() => {
    const rng = mkRng(0xc0ffee);
    const COUNT = 35;
    return Array.from({ length: COUNT }, (_, i) => {
      const isEmoji = i < 6;
      return {
        id: i,
        isEmoji,
        emoji: isEmoji ? ACCENT_EMOJIS[i % ACCENT_EMOJIS.length] : null,
        // Shape for geometric particles: 0=circle, 1=diamond, 2=ring, 3=dot
        shape: Math.floor(rng() * 4),
        left: (i / COUNT) * 95 + 2 + (rng() - 0.5) * 6,
        top: rng() * 100,
        size: isEmoji ? 28 + Math.floor(rng() * 24) : 4 + Math.floor(rng() * 14),
        duration: 20 + rng() * 35,
        delay: -(rng() * 45),
        drift: (rng() - 0.5) * 100,
        rotS: (rng() - 0.5) * 30,
        rotE: (rng() - 0.5) * 30,
        opacity: isEmoji ? 0.06 + rng() * 0.04 : 0.08 + rng() * 0.12,
        // For geometric particles: which accent color
        colorIdx: Math.floor(rng() * 5) + 1,
      };
    });
  }, []);

  return (
    <>
      {/* Animated gradient base layer */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, var(--bg-glow-1, rgba(255,46,184,0.07)) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, var(--bg-glow-2, rgba(0,229,255,0.06)) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 90%, var(--bg-glow-3, rgba(255,204,0,0.05)) 0%, transparent 50%)
          `,
          animation: "bgPulse 12s ease-in-out infinite alternate",
        }}
      />

      {/* Animated grid overlay */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid-color, rgba(26,26,26,0.03)) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-color, rgba(26,26,26,0.03)) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          animation: "gridShift 25s linear infinite",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      {/* Floating particles + accent emojis */}
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none z-0"
        aria-hidden="true"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}
      >
        {particles.map((p) =>
          p.isEmoji ? (
            <span
              key={p.id}
              className="absolute select-none leading-none"
              style={{
                left: `${p.left}%`,
                bottom: "-15%",
                fontSize: `${p.size}px`,
                opacity: p.opacity,
                "--drift": `${p.drift}px`,
                "--rot-s": `${p.rotS}deg`,
                "--rot-e": `${p.rotE}deg`,
                animation: `floatUp ${p.duration}s ${p.delay}s linear infinite`,
                filter: "blur(0.5px)",
              }}
            >
              {p.emoji}
            </span>
          ) : (
            <div
              key={p.id}
              className="absolute"
              style={{
                left: `${p.left}%`,
                bottom: "-10%",
                width: `${p.size}px`,
                height: `${p.size}px`,
                opacity: p.opacity,
                background:
                  p.shape === 2
                    ? "transparent"
                    : `var(--conf-${p.colorIdx})`,
                border:
                  p.shape === 2
                    ? `2px solid var(--conf-${p.colorIdx})`
                    : "none",
                borderRadius: p.shape === 0 || p.shape === 2 ? "50%" : "2px",
                transform: p.shape === 1 ? "rotate(45deg)" : "none",
                "--drift": `${p.drift}px`,
                "--rot-s": `${p.rotS}deg`,
                "--rot-e": `${p.rotE}deg`,
                animation: `floatUp ${p.duration}s ${p.delay}s linear infinite`,
                filter: "blur(0.5px)",
              }}
            />
          )
        )}
      </div>
    </>
  );
}
