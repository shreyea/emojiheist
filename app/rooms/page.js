"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRoomRegistry } from "../../lib/roomRegistry";

export default function RoomsPage() {
  const router = useRouter();
  const { rooms, loading } = useRoomRegistry();
  const [playerName, setPlayerName] = useState("");

  function handleJoin(roomId, asSpectator) {
    if (!playerName.trim()) return;
    const url = `/room/${roomId}?name=${encodeURIComponent(playerName.trim())}${asSpectator ? "&spectator=1" : ""}`;
    router.push(url);
  }

  return (
    <div className="flex flex-col items-center gap-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="text-center">
        <p className="label">Browse</p>
        <h2 className="text-3xl font-extrabold" style={{ color: 'var(--accent)' }}>
          PUBLIC ROOMS
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Find a game to join
        </p>
      </div>

      <div className="w-full max-w-md">
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name to join"
          maxLength={16}
          className="input-field w-full text-center text-lg font-semibold"
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <div
            className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
          <span className="text-sm font-semibold">Looking for rooms...</span>
        </div>
      )}

      {!loading && rooms.length === 0 && (
        <div className="card w-full max-w-md text-center">
          <p className="text-4xl mb-3">{"\uD83C\uDFDA\uFE0F"}</p>
          <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            No public rooms available
          </p>
          <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>
            Be the first to create one!
          </p>
          <button
            onClick={() => router.push("/")}
            className="btn btn-primary text-sm px-6 py-2.5"
          >
            Create a Room
          </button>
        </div>
      )}

      {!loading && rooms.length > 0 && (
        <div className="w-full max-w-md space-y-3">
          {rooms.map((room) => {
            const inGame = room.phase !== "lobby";
            const isFull = room.playerCount >= room.maxPlayers;

            return (
              <div
                key={room.roomId}
                className="card-sm flex items-center gap-4 animate-[slideIn_0.2s_ease-out]"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-extrabold tracking-wider" style={{ color: 'var(--accent)' }}>
                      {room.roomId}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg"
                      style={inGame
                        ? { backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)', border: '1px solid var(--border-light)' }
                        : { backgroundColor: 'rgba(34,197,94,0.15)', color: 'rgb(22,163,74)', border: '1px solid rgba(34,197,94,0.3)' }
                      }
                    >
                      {inGame ? "In Game" : "Lobby"}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {room.playerCount} / {room.maxPlayers} players
                    {room.hostName ? ` \u00B7 Host: ${room.hostName}` : ""}
                  </p>
                </div>

                <button
                  onClick={() => handleJoin(room.roomId, inGame)}
                  disabled={!playerName.trim() || (isFull && !inGame)}
                  className="btn btn-primary text-sm px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {inGame ? "Spectate" : isFull ? "Full" : "Join"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => router.push("/")}
        className="btn btn-ghost text-sm font-semibold mt-2"
      >
        Back to Home
      </button>
    </div>
  );
}
