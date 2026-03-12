"use client";

import { useState } from "react";
import { playVoteStamp } from "../lib/sounds";

export default function VotingScreen({
  players,
  spectators,
  currentPlayerId,
  plannerId,
  onVote,
  hasVoted,
  votes,
  voteTimeLeft,
}) {
  const [selectedId, setSelectedId] = useState(null);

  // Exclude planner and spectators from votable candidates
  const spectatorIds = new Set((spectators || []).map((s) => s.id));
  const candidates = players.filter(
    (p) => p.id !== plannerId && !spectatorIds.has(p.id)
  );

  function handleVote() {
    if (!selectedId || hasVoted) return;
    playVoteStamp();
    onVote(selectedId);
  }

  const progress = (voteTimeLeft / 15) * 100;
  const isUrgent = voteTimeLeft <= 5;

  return (
    <div className="flex flex-col items-center gap-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="text-center">
        <p className="label mb-1" style={{ color: "var(--accent)" }}>
          Voting Phase
        </p>
        <h2
          className="text-2xl font-extrabold tracking-wide uppercase"
          style={{ color: "var(--text-primary)" }}
        >
          Who Is The Inside Man?
        </h2>
      </div>

      {/* Vote timer */}
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-2xl font-bold tabular-nums"
            style={{
              color: isUrgent ? "var(--timer-low)" : "var(--text-primary)",
              animation: isUrgent ? "tickPulse 0.12s ease-out" : undefined,
            }}
          >
            {voteTimeLeft}s
          </span>
          <span className="label">
            {votes.length} vote{votes.length !== 1 ? "s" : ""} cast
          </span>
        </div>
        <div
          className="w-full rounded-full h-3 overflow-hidden"
          style={{ background: "var(--bg-surface)", border: "2px solid var(--border-light)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{
              width: `${progress}%`,
              background: isUrgent ? "var(--timer-low)" : "var(--accent)",
            }}
          />
        </div>
      </div>

      {/* Candidate cards */}
      <div className="card w-full max-w-md">
        <p className="label mb-4">Vote for the saboteur</p>
        <div className="space-y-2">
          {candidates.map((p) => {
            const isMe = p.id === currentPlayerId;
            const isSelected = selectedId === p.id;
            const isVoted = hasVoted && isSelected;

            return (
              <div key={p.id} className="relative">
                <button
                  onClick={() => !hasVoted && setSelectedId(p.id)}
                  disabled={hasVoted}
                  className="card-sm w-full flex items-center gap-3 text-left
                             hover:rotate-1 transition-transform"
                  style={
                    isSelected
                      ? {
                          background: "var(--accent)",
                          color: "var(--bg-page)",
                          borderColor: "var(--border)",
                        }
                      : {
                          cursor: hasVoted ? "not-allowed" : "pointer",
                          opacity: hasVoted && !isSelected ? 0.6 : 1,
                        }
                  }
                >
                  <span className="text-xl">{"\u{1F60E}"}</span>
                  <span
                    className="font-bold flex-1"
                    style={{
                      color: isSelected ? "var(--bg-page)" : "var(--text-primary)",
                    }}
                  >
                    {p.name}
                  </span>
                  {isMe && (
                    <span
                      className="text-xs font-bold"
                      style={{
                        color: isSelected ? "var(--bg-page)" : "var(--text-muted)",
                        opacity: 0.7,
                      }}
                    >
                      (you)
                    </span>
                  )}
                </button>

                {/* VOTED stamp overlay */}
                {isVoted && (
                  <div
                    className="absolute inset-0 flex items-center justify-center
                               pointer-events-none animate-[stamp_0.3s_ease-out]"
                  >
                    <span
                      className="text-2xl font-extrabold tracking-widest uppercase
                                 rotate-[-12deg] px-3 py-1 rounded-lg"
                      style={{
                        color: "var(--accent)",
                        border: "3px solid var(--accent)",
                        background: "color-mix(in srgb, var(--bg-card) 80%, transparent)",
                      }}
                    >
                      VOTED!
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!hasVoted ? (
          <button
            onClick={handleVote}
            disabled={!selectedId}
            className="btn btn-primary w-full mt-4"
          >
            Cast Vote
          </button>
        ) : (
          <p
            className="mt-4 text-center text-sm font-semibold"
            style={{ color: "var(--text-muted)" }}
          >
            Vote submitted! Waiting for others...
          </p>
        )}
      </div>
    </div>
  );
}
