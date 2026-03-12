"use client";

import { useEffect, useState } from "react";
import { getPlayerStats } from "../lib/playerStats";

export default function PlayerStatsCard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setStats(getPlayerStats());
  }, []);

  if (!stats) return null;

  return (
    <div className="card w-full max-w-xs animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center surface"
        >
          <span className="text-xl">{"\u{1F3AE}"}</span>
        </div>
        <div>
          <p
            className="font-bold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            {stats.name}
          </p>
          <p className="label" style={{ fontSize: "0.65rem" }}>
            Your Stats
          </p>
        </div>
      </div>

      {/* Stat blocks */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="surface py-3 px-1">
          <p
            className="text-xl font-extrabold tabular-nums"
            style={{ color: "var(--accent-gold)" }}
          >
            {stats.gamesPlayed}
          </p>
          <p className="label mt-1">Games</p>
        </div>
        <div className="surface py-3 px-1">
          <p
            className="text-xl font-extrabold tabular-nums"
            style={{ color: "var(--accent-gold)" }}
          >
            {stats.gamesWon}
          </p>
          <p className="label mt-1">Wins</p>
        </div>
        <div className="surface py-3 px-1">
          <p
            className="text-xl font-extrabold tabular-nums"
            style={{ color: "var(--accent-gold)" }}
          >
            {stats.totalPoints}
          </p>
          <p className="label mt-1">Points</p>
        </div>
      </div>
    </div>
  );
}
