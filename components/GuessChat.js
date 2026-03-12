"use client";

import { useState, useRef, useEffect } from "react";
import { playCorrectGuess } from "../lib/sounds";

const MAX_CHARS = 50;
const COOLDOWN_MS = 1000;

export default function GuessChat({ guesses, onGuess, disabled, playerName, correctGuessers }) {
  const [input, setInput] = useState("");
  const [cooldown, setCooldown] = useState(false);
  const chatEndRef = useRef(null);
  const lastGuessRef = useRef(0);
  const prevCorrectRef = useRef(new Set());

  // Auto-scroll to bottom on new guess
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [guesses.length]);

  // Play sound when a new correct guesser appears
  useEffect(() => {
    const correctSet = new Set(correctGuessers || []);
    for (const name of correctSet) {
      if (!prevCorrectRef.current.has(name)) {
        playCorrectGuess();
        break;
      }
    }
    prevCorrectRef.current = correctSet;
  }, [correctGuessers]);

  function handleSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || disabled || cooldown) return;

    const now = Date.now();
    if (now - lastGuessRef.current < COOLDOWN_MS) return;
    lastGuessRef.current = now;

    const name = playerName || "Player";
    onGuess({ name, text });
    setInput("");

    setCooldown(true);
    setTimeout(() => setCooldown(false), COOLDOWN_MS);
  }

  const correctSet = new Set(correctGuessers || []);

  return (
    <div className="card w-full flex flex-col overflow-hidden" style={{ padding: 0 }}>
      {/* Header */}
      <div
        className="px-5 py-3"
        style={{ borderBottom: "2px solid var(--border-light)" }}
      >
        <h3 className="label">Guesses</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-[200px] max-h-[300px] overflow-y-auto p-4 space-y-2">
        {guesses.length === 0 && (
          <p
            className="text-center text-sm py-8"
            style={{ color: "var(--text-muted)" }}
          >
            No guesses yet...
          </p>
        )}
        {guesses.map((g, i) => {
          const isCorrect = correctSet.has(g.name);
          return (
            <div
              key={i}
              className="card-sm animate-[slideIn_0.2s_ease-out]"
              style={
                isCorrect
                  ? {
                      background: "var(--correct-bg)",
                      borderColor: "var(--border)",
                    }
                  : undefined
              }
            >
              <div className="flex items-start gap-1.5 flex-wrap">
                {isCorrect && (
                  <>
                    <span
                      className="text-xs font-extrabold animate-[sparkle_0.6s_ease-out]"
                      style={{ color: "var(--correct-text)" }}
                    >
                      {"\u2714"}
                    </span>
                    <span
                      className="chip"
                      style={{ background: "var(--correct-bg)", color: "var(--correct-text)" }}
                    >
                      Correct!
                    </span>
                  </>
                )}
              </div>
              <div>
                <span
                  className="font-bold"
                  style={{ color: "var(--accent)" }}
                >
                  {g.name}:{" "}
                </span>
                <span
                  style={{
                    color: isCorrect ? "var(--correct-text)" : "var(--text-primary)",
                  }}
                >
                  {g.text}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 flex gap-2"
        style={{ borderTop: "2px solid var(--border-light)" }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
          disabled={disabled}
          placeholder={disabled ? "Time's up!" : "Type your guess..."}
          maxLength={MAX_CHARS}
          className="input-field flex-1"
          style={{ borderRadius: "9999px" }}
        />
        <button
          type="submit"
          disabled={disabled || !input.trim() || cooldown}
          className="btn btn-primary"
        >
          Send
        </button>
      </form>
    </div>
  );
}
