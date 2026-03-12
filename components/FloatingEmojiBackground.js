"use client";

import { useMemo } from "react";

const EMOJIS = [
  "🕵️","🎨","🏛️","🔍","💰","🚗","🗝️","💎","🏺","🔐",
  "🎭","🏆","🌙","⭐","🔮","🎪","📜","🧲","🎯","🃏",
  "🦊","🌀","🪄","🧩","🏮",
];

// Deterministic PRNG so server & client produce the same bubbles
function mkRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export default function FloatingEmojiBackground() {
  const bubbles = useMemo(() => {
    const rng = mkRng(0xc0ffee);
    const COUNT = 14;
    return Array.from({ length: COUNT }, (_, i) => ({
      id: i,
      emoji:    EMOJIS[i % EMOJIS.length],
      // Evenly distribute across viewport width with slight jitter
      left:     (i / COUNT) * 85 + 5 + (rng() - 0.5) * 8,
      size:     80 + Math.floor(rng() * 100),   // 80 – 180 px
      duration: 28 + rng() * 24,                 // 28 – 52 s
      delay:    -(rng() * 40),                   // stagger start times
      drift:    (rng() - 0.5) * 140,             // ± 70 px horizontal
      rotS:     (rng() - 0.5) * 40,
      rotE:     (rng() - 0.5) * 40,
      opacity:  0.04 + rng() * 0.04,             // 0.04 – 0.08
    }));
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none z-0"
      aria-hidden="true"
      style={{
        // Soft fade at top & bottom so emojis don't pop in/out abruptly
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
    >
      {bubbles.map((b) => (
        <span
          key={b.id}
          className="absolute select-none leading-none"
          style={{
            left:      `${b.left}%`,
            bottom:    "-20%",
            fontSize:  `${b.size}px`,
            opacity:   b.opacity,
            "--drift":  `${b.drift}px`,
            "--rot-s":  `${b.rotS}deg`,
            "--rot-e":  `${b.rotE}deg`,
            animation: `floatUp ${b.duration}s ${b.delay}s linear infinite`,
          }}
        >
          {b.emoji}
        </span>
      ))}
    </div>
  );
}
