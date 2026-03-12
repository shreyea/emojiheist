"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { generateRoomCode } from "../lib/roomCode";
import { useRoomRegistry } from "../lib/roomRegistry";
import PlayerStatsCard from "../components/PlayerStats";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [mode, setMode] = useState(null);
  const [quickPlayStatus, setQuickPlayStatus] = useState(null);
  const { rooms } = useRoomRegistry();

  function handleCreate() {
    if (!playerName.trim()) return;
    const code = generateRoomCode();
    router.push(`/room/${code}?name=${encodeURIComponent(playerName.trim())}`);
  }

  function handleJoin() {
    if (!playerName.trim() || !joinCode.trim()) return;
    router.push(`/room/${joinCode.trim().toUpperCase()}?name=${encodeURIComponent(playerName.trim())}`);
  }

  const handleQuickPlay = useCallback(() => {
    if (!playerName.trim()) return;
    setQuickPlayStatus("Searching for rooms...");

    const openRoom = rooms.find(
      (r) => r.phase === "lobby" && r.playerCount < r.maxPlayers
    );

    if (openRoom) {
      setQuickPlayStatus("Found a room! Joining...");
      router.push(`/room/${openRoom.roomId}?name=${encodeURIComponent(playerName.trim())}`);
    } else {
      setQuickPlayStatus("No rooms found. Creating one...");
      const code = generateRoomCode();
      router.push(`/room/${code}?name=${encodeURIComponent(playerName.trim())}`);
    }
  }, [playerName, rooms, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 text-center">
      <div className="animate-[bounceIn_0.5s_ease-out]">
        <p className="text-7xl md:text-8xl mb-4">&#128142;</p>
        <h2 className="text-4xl md:text-5xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
          <span style={{ color: 'var(--accent)' }}>Emoji</span> Heist
        </h2>
        <p className="mt-3 text-lg max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Explain the mission using emojis. Can your friends guess it?
        </p>
        <p className="mt-1 text-sm max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
          One player secretly sabotages the team. Play with 4&#8211;8 players.
        </p>
      </div>

      {!mode && (
        <div className="flex flex-col gap-3 w-full max-w-xs animate-[fadeIn_0.3s_ease-out]">
          <button
            onClick={() => setMode("quickplay")}
            className="btn btn-primary text-xl px-10 py-4"
          >
            Quick Play
          </button>
          <button
            onClick={() => setMode("create")}
            className="btn btn-secondary text-xl px-10 py-4"
          >
            Create Room
          </button>
          <button
            onClick={() => setMode("join")}
            className="btn btn-secondary text-xl px-10 py-4"
          >
            Join Room
          </button>

          <div className="flex gap-3 mt-1">
            <button
              onClick={() => router.push("/rooms")}
              className="btn btn-ghost flex-1 text-sm px-4 py-3"
            >
              Browse Rooms
            </button>
            <button
              onClick={() => router.push("/game")}
              className="btn btn-ghost flex-1 text-sm px-4 py-3"
            >
              Solo Play
            </button>
          </div>
        </div>
      )}

      {mode === "quickplay" && (
        <div className="card w-full max-w-sm animate-[fadeIn_0.2s_ease-out]">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Quick Play
          </h3>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name"
              maxLength={16}
              className="input-field text-center text-lg font-semibold"
            />
            <button
              onClick={handleQuickPlay}
              disabled={!playerName.trim()}
              className="btn btn-primary text-lg px-8 py-3 disabled:opacity-40 disabled:cursor-not-allowed mt-1"
            >
              {quickPlayStatus || "Find a Game"}
            </button>
            <button
              onClick={() => { setMode(null); setQuickPlayStatus(null); }}
              className="btn btn-ghost text-sm font-semibold"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {(mode === "create" || mode === "join") && (
        <div className="card w-full max-w-sm animate-[fadeIn_0.2s_ease-out]">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {mode === "create" ? "Create a Room" : "Join a Room"}
          </h3>

          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name"
              maxLength={16}
              className="input-field text-center text-lg font-semibold"
            />

            {mode === "join" && (
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Room code"
                maxLength={4}
                className="input-field rounded-full text-center text-2xl font-extrabold tracking-[0.3em] uppercase"
              />
            )}

            <button
              onClick={mode === "create" ? handleCreate : handleJoin}
              disabled={!playerName.trim() || (mode === "join" && !joinCode.trim())}
              className="btn btn-primary text-lg px-8 py-3 disabled:opacity-40 disabled:cursor-not-allowed mt-1"
            >
              {mode === "create" ? "Create & Join" : "Join Room"}
            </button>

            <button
              onClick={() => setMode(null)}
              className="btn btn-ghost text-sm font-semibold"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {!mode && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-2xl w-full mt-4">
            {[
              { icon: "\uD83D\uDD0D", title: "Plan", desc: "Use emojis to describe the mission" },
              { icon: "\uD83E\uDD14", title: "Guess", desc: "Crack the mission from emoji clues" },
              { icon: "\u23F1\uFE0F", title: "Race", desc: "Beat the clock to score points" },
              { icon: "\uD83D\uDD75\uFE0F", title: "Sabotage", desc: "One player is the Inside Man" },
            ].map((item, i) => (
              <div key={i} className="card-sm">
                <p className="text-3xl mb-2">{item.icon}</p>
                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-2">
            <PlayerStatsCard />
          </div>
        </>
      )}
    </div>
  );
}
