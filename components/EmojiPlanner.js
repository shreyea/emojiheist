"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import data from "@emoji-mart/data";

const Picker = dynamic(() => import("@emoji-mart/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div
      className="h-[350px] flex items-center justify-center text-sm"
      style={{ color: "var(--text-muted)" }}
    >
      Loading picker...
    </div>
  ),
});

export default function EmojiPlanner({ mission, emojiLimit, onSubmit }) {
  const [emojis, setEmojis] = useState([]);
  const [showPicker, setShowPicker] = useState(true);

  const isUnlimited = emojiLimit >= 99;

  const addEmoji = useCallback(
    (emojiData) => {
      if (!isUnlimited && emojis.length >= emojiLimit) return;
      setEmojis((prev) => [...prev, emojiData.native]);
    },
    [emojis.length, emojiLimit, isUnlimited]
  );

  const removeEmoji = useCallback((index) => {
    setEmojis((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearEmojis = useCallback(() => {
    setEmojis([]);
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (emojis.length > 0 && (isUnlimited || emojis.length <= emojiLimit)) {
      onSubmit(emojis.join(""));
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {/* Mission reveal */}
      <div className="card w-full text-center">
        <p className="label mb-2">Your Secret Mission</p>
        <p
          className="text-2xl font-extrabold py-3 leading-snug"
          style={{ color: "var(--accent)" }}
        >
          {mission.sentence}
        </p>
        {mission.genre && (
          <span
            className="inline-block mt-1 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider"
            style={{
              background: "var(--bg-surface)",
              color: "var(--accent-alt)",
              border: "2px solid var(--border-light)",
            }}
          >
            {mission.genre}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
        {/* Selected emojis area */}
        <div className="card w-full">
          <p className="label mb-3">Your emoji plan</p>

          <div
            className="surface-border min-h-[80px] flex items-center justify-center gap-3 p-4"
          >
            {emojis.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Pick emojis below
              </p>
            ) : (
              emojis.map((e, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => removeEmoji(i)}
                  className="text-5xl relative group cursor-pointer
                             hover:scale-125 active:scale-90 transition-transform"
                  title="Click to remove"
                >
                  {e}
                  <span
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full
                               text-[11px] font-bold flex items-center justify-center
                               opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: "var(--accent)",
                      color: "var(--bg-page)",
                      border: "2px solid var(--border)",
                    }}
                  >
                    {"\u00D7"}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="flex items-center justify-between mt-3">
            <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              <span
                style={{
                  color:
                    !isUnlimited && emojis.length >= emojiLimit
                      ? "var(--timer-low)"
                      : "var(--accent-gold)",
                  fontWeight: 800,
                }}
              >
                {emojis.length}
              </span>{" "}
              / {isUnlimited ? "∞" : emojiLimit} emojis
            </p>
            {emojis.length > 0 && (
              <button
                type="button"
                onClick={clearEmojis}
                className="btn btn-ghost text-sm px-3 py-1"
                style={{ color: "var(--timer-low)" }}
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Emoji picker toggle */}
        <div className="card w-full" style={{ padding: 0, overflow: "hidden" }}>
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className="btn btn-secondary w-full"
            style={{ borderRadius: "12px 12px 0 0", border: "none", boxShadow: "none" }}
          >
            <span>Emoji Picker</span>
            <span style={{ color: "var(--accent)" }}>
              {showPicker ? "\u25B2" : "\u25BC"}
            </span>
          </button>
          {showPicker && (
            <div style={{ borderTop: "2px solid var(--border-light)" }}>
              <Picker
                data={data}
                onEmojiSelect={addEmoji}
                theme="auto"
                set="native"
                previewPosition="none"
                skinTonePosition="none"
                maxFrequentRows={1}
                perLine={8}
              />
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={emojis.length === 0}
          className="btn btn-primary w-full text-lg py-4"
        >
          Lock In Plan
        </button>
      </form>
    </div>
  );
}
