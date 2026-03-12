"use client";

import { useEffect, useState } from "react";

export default function Confetti({ active }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!active) { setPieces([]); return; }
    setPieces(
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left:    Math.random() * 100,
        colorVar:`var(--conf-${(i % 5) + 1})`,
        delay:   Math.random() * 2.2,
        duration:2.8 + Math.random() * 2,
        size:    7 + Math.random() * 9,
        rotEnd:  (Math.random() - 0.5) * 800,
        shape:   i % 3, // 0=square  1=circle  2=rect
      }))
    );
  }, [active]);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50" aria-hidden="true">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0"
          style={{
            left:         `${p.left}%`,
            width:        p.shape === 2 ? `${p.size * 2.2}px` : `${p.size}px`,
            height:       `${p.size}px`,
            background:   p.colorVar,
            borderRadius: p.shape === 1 ? "50%" : "2px",
            border:       `1.5px solid color-mix(in srgb, ${p.colorVar} 60%, #000)`,
            animation:    `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
            "--rot-end":  `${p.rotEnd}deg`,
          }}
        />
      ))}
    </div>
  );
}
