"use client";

import { useEffect, useRef } from "react";
import Confetti from "./Confetti";
import { playRoundStart } from "../lib/sounds";

const RANK_ICONS = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];

export default function Scoreboard({ players, isHost, onNextRound, gameOver, onPlayAgain }) {
  const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  const gameOverSoundRef = useRef(false);

  // Play fanfare once when game over
  useEffect(() => {
    if (gameOver && !gameOverSoundRef.current) {
      gameOverSoundRef.current = true;
      playRoundStart();
    }
  }, [gameOver]);

  return (
    <div className="flex flex-col items-center gap-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Confetti on game over */}
      {gameOver && <Confetti active />}

      {/* Header */}
      <div className="text-center">
        {gameOver ? (
          <>
            <p className="text-5xl mb-2 animate-[bounceIn_0.4s_ease-out]">{"\u{1F3C6}"}</p>
            <h2
              className="text-4xl font-extrabold tracking-wide uppercase"
              style={{ color: "var(--text-primary)" }}
            >
              Game Over
            </h2>
            {sorted[0] && (
              <p
                className="text-2xl font-extrabold mt-2"
                style={{ color: "var(--accent)" }}
              >
                {sorted[0].name} wins!
              </p>
            )}
          </>
        ) : (
          <>
            <p className="label mb-1" style={{ color: "var(--accent)" }}>
              Standings
            </p>
            <h2
              className="text-2xl font-extrabold"
              style={{ color: "var(--text-primary)" }}
            >
              Scoreboard
            </h2>
          </>
        )}
      </div>

      {/* Player rows */}
      <div className="card w-full max-w-md">
        <div className="space-y-2">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className="card-sm flex items-center gap-3 animate-[slideIn_0.2s_ease-out]"
              style={{
                animationDelay: `${i * 0.05}s`,
                animationFillMode: "both",
                ...(gameOver && i === 0
                  ? {
                      borderColor: "var(--accent)",
                      background:
                        "color-mix(in srgb, var(--accent-gold) 15%, var(--bg-card))",
                    }
                  : {}),
              }}
            >
              <span className="text-2xl w-8 text-center">
                {RANK_ICONS[i] ?? `${i + 1}.`}
              </span>
              <span
                className="font-bold flex-1"
                style={{ color: "var(--text-primary)" }}
              >
                {p.name}
              </span>
              <span
                className="text-xl font-extrabold tabular-nums"
                style={{ color: "var(--accent-gold)" }}
              >
                {p.score || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      {gameOver ? (
        isHost ? (
          <button onClick={onPlayAgain} className="btn btn-primary text-lg px-8 py-3">
            Play Again
          </button>
        ) : (
          <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
            Waiting for host to restart...
          </p>
        )
      ) : isHost ? (
        <button onClick={onNextRound} className="btn btn-primary text-lg px-8 py-3">
          Next Round
        </button>
      ) : (
        <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
          Waiting for host to start next round...
        </p>
      )}
    </div>
  );
}
