"use client";

import { useState, useEffect, useRef } from "react";
import { playTick, playTimerUrgent } from "../lib/sounds";

const CIRCUMFERENCE = 251.33; // 2 * Math.PI * 40

/**
 * Timer component.
 * - Local mode (default): runs its own countdown, fires onHintReveal/onTimeUp.
 * - Synced mode: pass `syncedTimeLeft` to control display from outside.
 */
export default function Timer({
  duration,
  hintTime,
  hint,
  onHintReveal,
  onTimeUp,
  syncedTimeLeft,
  hintRevealed: externalHintRevealed,
}) {
  const synced = syncedTimeLeft !== undefined;
  const [localTimeLeft, setLocalTimeLeft] = useState(duration);
  const hintRevealedRef = useRef(false);
  const doneRef = useRef(false);
  const prevTimeRef = useRef(null);

  // Local countdown (only when not synced)
  useEffect(() => {
    if (synced) return;

    const timer = setInterval(() => {
      setLocalTimeLeft((prev) => {
        const next = prev - 1;

        if (next <= duration - hintTime && !hintRevealedRef.current) {
          hintRevealedRef.current = true;
          setTimeout(() => onHintReveal(), 0);
        }

        if (next <= 0) {
          clearInterval(timer);
          if (!doneRef.current) {
            doneRef.current = true;
            setTimeout(() => onTimeUp(), 0);
          }
          return 0;
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [synced]);

  const timeLeft = synced ? syncedTimeLeft : localTimeLeft;
  const elapsed = duration - timeLeft;
  const isUrgent = timeLeft <= 10;
  const showHint = synced ? externalHintRevealed : elapsed >= hintTime;

  // Play tick/urgent sounds
  useEffect(() => {
    if (prevTimeRef.current === null) {
      prevTimeRef.current = timeLeft;
      return;
    }
    if (timeLeft !== prevTimeRef.current) {
      prevTimeRef.current = timeLeft;
      if (timeLeft <= 5) {
        playTimerUrgent();
      } else if (timeLeft <= 10) {
        playTick();
      }
    }
  }, [timeLeft]);

  // SVG arc: starts full, drains to empty
  const strokeDashoffset = (1 - timeLeft / duration) * CIRCUMFERENCE;

  const strokeColor =
    timeLeft > 30
      ? "var(--timer-high)"
      : timeLeft > 10
      ? "var(--timer-mid)"
      : "var(--timer-low)";

  return (
    <div
      className="card w-full"
      style={
        timeLeft <= 5
          ? { animation: "screenShake 0.4s ease-in-out infinite" }
          : undefined
      }
    >
      <div className="flex flex-col items-center gap-4">
        {/* SVG circular timer */}
        <div className="relative flex items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            width="120"
            height="120"
            style={{ transform: "rotate(-90deg)" }}
          >
            {/* Track */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="var(--border)"
              strokeWidth="8"
            />
            {/* Progress arc */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={strokeColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
          </svg>
          {/* Center label */}
          <div
            className="absolute flex flex-col items-center"
            style={{ transform: "none" }}
          >
            <span
              className="text-4xl font-extrabold tabular-nums leading-none animate-[tickPulse_0.12s_ease-out]"
              style={{ color: isUrgent ? "var(--timer-low)" : "var(--text-primary)" }}
            >
              {timeLeft}
            </span>
            <span className="label" style={{ marginTop: "2px" }}>
              sec
            </span>
          </div>
        </div>

        {/* Hint box */}
        {showHint ? (
          <div
            className="w-full rounded-xl px-4 py-3 text-center animate-[hintReveal_0.4s_ease-out]"
            style={{
              background: "var(--hint-bg)",
              border: "2px solid var(--border)",
            }}
          >
            <span className="label block mb-1">Hint</span>
            <span
              className="text-lg font-extrabold"
              style={{ color: "var(--hint-text)" }}
            >
              {hint.charAt(0).toUpperCase() + hint.slice(1)}
            </span>
          </div>
        ) : (
          <div
            className="w-full rounded-xl px-4 py-3 text-center surface"
          >
            <span className="label block mb-1">Hint</span>
            <span
              className="text-lg font-bold tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              ? ? ?
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
