"use client";

import { useState } from "react";

const EMOJI_LIMIT_OPTIONS = [4, 6, 8, 10, 99];
const ROUND_TIME_OPTIONS = [45, 60, 120];
const TOTAL_ROUNDS_OPTIONS = [5, 10];

export default function Lobby({ roomId, players, spectators, isHost, settings, onStart, onSettingsChange }) {
  const [showSettings, setShowSettings] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  function updateSetting(key, value) {
    if (!onSettingsChange) return;
    onSettingsChange({ ...settings, [key]: value });
  }

  function copyInviteLink() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/room/${roomId}`;
    if (navigator.clipboard && url) {
      navigator.clipboard.writeText(url).then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      });
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Room code */}
      <div className="card w-full max-w-md text-center">
        <p className="label mb-2">Room Code</p>
        <p
          className="text-5xl md:text-6xl font-extrabold tracking-[0.3em] mb-4"
          style={{ color: "var(--accent)" }}
        >
          {roomId}
        </p>

        {/* Invite link */}
        <button
          onClick={copyInviteLink}
          className="btn btn-secondary mx-auto"
        >
          {linkCopied ? (
            <span style={{ color: "var(--timer-high)" }}>
              {"\u2714"} Invite link copied!
            </span>
          ) : (
            <span>
              {"\uD83D\uDD17"} Copy Invite Link
            </span>
          )}
        </button>
      </div>

      {/* Players */}
      <div className="card w-full max-w-md">
        <p className="label mb-4">Players ({players.length})</p>
        <div className="space-y-2">
          {players.map((p, i) => (
            <div
              key={p.id}
              className="card-sm flex items-center gap-3 animate-[slideIn_0.2s_ease-out]"
              style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "both" }}
            >
              <span className="text-xl">
                {i === 0 ? "\u{1F451}" : "\u{1F60E}"}
              </span>
              <span
                className="font-bold flex-1"
                style={{ color: "var(--text-primary)" }}
              >
                {p.name}
              </span>
              {i === 0 && (
                <span
                  className="chip"
                  style={{ background: "var(--accent)", color: "var(--bg-page)" }}
                >
                  HOST
                </span>
              )}
            </div>
          ))}
        </div>

        {players.length < 2 && (
          <p
            className="text-center text-sm mt-4"
            style={{ color: "var(--text-muted)" }}
          >
            Waiting for more players to join...
          </p>
        )}
      </div>

      {/* Spectators */}
      {spectators && spectators.length > 0 && (
        <div className="card w-full max-w-md">
          <p className="label mb-3" style={{ opacity: 0.7 }}>
            Spectators ({spectators.length})
          </p>
          <div className="space-y-1.5">
            {spectators.map((s) => (
              <div
                key={s.id}
                className="card-sm flex items-center gap-3"
                style={{ opacity: 0.65 }}
              >
                <span className="text-lg">{"\u{1F440}"}</span>
                <span
                  className="font-medium text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {s.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Settings — host only */}
      {isHost && (
        <div className="card w-full max-w-md" style={{ padding: 0, overflow: "hidden" }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full px-6 py-4 flex items-center justify-between transition-opacity hover:opacity-80"
          >
            <span className="label">Game Settings</span>
            <span style={{ color: "var(--accent)", fontWeight: 700 }}>
              {showSettings ? "\u25B2" : "\u25BC"}
            </span>
          </button>

          {showSettings && (
            <div
              className="px-6 pb-5 space-y-5 pt-4"
              style={{ borderTop: "2px solid var(--border-light)" }}
            >
              {/* Public / Private */}
              <div>
                <p className="label mb-2">Public Room</p>
                <div className="flex gap-2">
                  {[true, false].map((opt) => (
                    <button
                      key={String(opt)}
                      onClick={() => updateSetting("isPublic", opt)}
                      className={`btn flex-1 py-2 text-sm ${
                        settings.isPublic === opt ? "btn-primary" : "btn-secondary"
                      }`}
                    >
                      {opt ? "ON" : "OFF"}
                    </button>
                  ))}
                </div>
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {settings.isPublic
                    ? "Room visible in public rooms list"
                    : "Only players with invite link can join"}
                </p>
              </div>

              {/* Emoji Limit */}
              <div>
                <p className="label mb-2">Emoji Limit</p>
                <div className="flex gap-2">
                  {EMOJI_LIMIT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => updateSetting("emojiLimit", opt)}
                      className={`btn flex-1 py-2 text-sm ${
                        settings.emojiLimit === opt ? "btn-primary" : "btn-secondary"
                      }`}
                    >
                      {opt >= 99 ? "∞" : opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Round Time */}
              <div>
                <p className="label mb-2">Round Time</p>
                <div className="flex gap-2">
                  {ROUND_TIME_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => updateSetting("roundTime", opt)}
                      className={`btn flex-1 py-2 text-sm ${
                        settings.roundTime === opt ? "btn-primary" : "btn-secondary"
                      }`}
                    >
                      {opt}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Rounds */}
              <div>
                <p className="label mb-2">Rounds</p>
                <div className="flex gap-2">
                  {TOTAL_ROUNDS_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => updateSetting("totalRounds", opt)}
                      className={`btn flex-1 py-2 text-sm ${
                        settings.totalRounds === opt ? "btn-primary" : "btn-secondary"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Start Game — host only */}
      {isHost && (
        <button
          onClick={onStart}
          disabled={players.length < 2}
          className="btn btn-primary text-xl px-12 py-4"
        >
          Start Game
        </button>
      )}

      {/* Waiting message — non-host */}
      {!isHost && (
        <div className="card-sm w-full max-w-md text-center">
          <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
            Waiting for host to start the game...
          </p>
        </div>
      )}
    </div>
  );
}
