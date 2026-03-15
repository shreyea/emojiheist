"use client";

// Three size tiers — big anchors, mid accents, small sprinkles.
// filter: grayscale(1) + very low opacity = clean "outline silhouette" feel.
// Each element has its own float speed + delay so nothing moves in sync.

const FLOATERS = [
  // ── Big tier ──────────────────────────────────── (~90–115px, op 0.065)
  { emoji: "🕵️", x:  5, y: 10, size: 112, op: 0.065, dur: 55, delay:   0, rot: -14 },
  { emoji: "💎",  x: 84, y:  6, size:  96, op: 0.065, dur: 62, delay: -18, rot:  16 },
  { emoji: "💰",  x: 77, y: 65, size: 108, op: 0.065, dur: 58, delay: -30, rot:   9 },
  { emoji: "🗝️", x:  4, y: 70, size:  92, op: 0.065, dur: 67, delay: -22, rot: -19 },

  // ── Medium tier ───────────────────────────────── (~48–64px, op 0.05)
  { emoji: "🎯",  x: 44, y:  3, size: 62, op: 0.05, dur: 48, delay:  -8, rot:   5 },
  { emoji: "🃏",  x: 23, y: 38, size: 54, op: 0.05, dur: 52, delay: -36, rot: -11 },
  { emoji: "🎭",  x: 70, y: 32, size: 58, op: 0.05, dur: 45, delay: -12, rot:  10 },
  { emoji: "🔒",  x: 56, y: 76, size: 60, op: 0.05, dur: 50, delay: -26, rot:  -8 },
  { emoji: "🪄",  x: 14, y: 56, size: 52, op: 0.05, dur: 44, delay: -42, rot:   7 },
  { emoji: "🔮",  x: 91, y: 46, size: 56, op: 0.05, dur: 55, delay: -16, rot:  -4 },

  // ── Small tier ────────────────────────────────── (~22–36px, op 0.04)
  { emoji: "💎",  x: 36, y: 20, size: 34, op: 0.04, dur: 40, delay:  -5, rot:  15 },
  { emoji: "🎯",  x: 62, y: 16, size: 28, op: 0.04, dur: 43, delay: -28, rot:  -9 },
  { emoji: "🗝️", x: 31, y: 60, size: 32, op: 0.04, dur: 38, delay: -17, rot:  12 },
  { emoji: "🃏",  x: 81, y: 84, size: 26, op: 0.04, dur: 46, delay: -33, rot: -14 },
  { emoji: "🔒",  x: 50, y: 87, size: 24, op: 0.04, dur: 41, delay: -21, rot:   8 },
  { emoji: "🕵️", x: 18, y: 86, size: 30, op: 0.04, dur: 49, delay: -10, rot:  -6 },
  { emoji: "🪄",  x: 73, y: 54, size: 28, op: 0.04, dur: 37, delay: -38, rot:  11 },
  { emoji: "🎭",  x: 42, y: 48, size: 22, op: 0.04, dur: 44, delay: -14, rot:  -7 },
];

export default function FloatingEmojiBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {FLOATERS.map((f, i) => (
        <span
          key={i}
          className="absolute select-none leading-none block bg-floater"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            fontSize: `${f.size}px`,
            lineHeight: 1,
            // per-element base opacity (adjusted by theme via CSS)
            "--op": f.op,
            filter: "grayscale(1)",
            "--rot": `${f.rot}deg`,
            // two animations: slow upward drift + local bob/sway for bubble effect
            animation: `bubbleDrift ${f.dur * 3}s linear ${f.delay}s infinite, gentleFloat ${f.dur}s ease-in-out ${f.delay}s infinite`,
            willChange: "transform",
          }}
        >
          {f.emoji}
        </span>
      ))}
    </div>
  );
}
