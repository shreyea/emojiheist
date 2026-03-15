"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useMemo, useEffect, useRef, useState } from "react";
import { useRoom } from "../../../lib/useRoom";
import { generateBlanks } from "../../../lib/generateBlanks";
import Lobby from "../../../components/Lobby";
import EmojiPlanner from "../../../components/EmojiPlanner";
import EmojiDisplay from "../../../components/EmojiDisplay";
import SentenceBlanks from "../../../components/SentenceBlanks";
import GuessChat from "../../../components/GuessChat";
import Timer from "../../../components/Timer";
import VotingScreen from "../../../components/VotingScreen";
import Scoreboard from "../../../components/Scoreboard";

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = params.roomId;
  const nameFromUrl = searchParams.get("name");

  const [enteredName, setEnteredName] = useState("");
  const [confirmedName, setConfirmedName] = useState(nameFromUrl || "");

  const room = useRoom(roomId, confirmedName || null);
  const timerStartedRef = useRef(false);
  const votingStartedRef = useRef(false);
  const resultsEvaluatedRef = useRef(false);
  const scoreboardShownRef = useRef(false);
  const [hasVoted, setHasVoted] = useState(false);

  function handleNameSubmit(e) {
    e.preventDefault();
    const name = enteredName.trim();
    if (!name) return;
    setConfirmedName(name);
    router.replace(`/room/${roomId}?name=${encodeURIComponent(name)}`);
  }

  // Reset per-round local flags
  useEffect(() => {
    if (room.phase === "planner") {
      timerStartedRef.current = false;
      votingStartedRef.current = false;
      resultsEvaluatedRef.current = false;
      scoreboardShownRef.current = false;
      setHasVoted(false);
    }
  }, [room.phase]);

  // Host starts guessing timer
  useEffect(() => {
    if (room.phase === "guessing" && room.isHost && !timerStartedRef.current) {
      timerStartedRef.current = true;
      room.startTimer();
    }
  }, [room.phase, room.isHost]);

  // Host transitions to voting when guessing timer ends
  useEffect(() => {
    if (room.phase === "guessing" && room.timeLeft <= 0 && room.isHost && !votingStartedRef.current) {
      votingStartedRef.current = true;
      room.startVoting(); // now also starts vote timer internally
    }
  }, [room.timeLeft, room.phase, room.isHost]);

  // Host evaluates results when vote timer ends
  useEffect(() => {
    if (room.phase === "voting" && room.voteTimeLeft <= 0 && room.isHost && !resultsEvaluatedRef.current) {
      resultsEvaluatedRef.current = true;
      room.evaluateResults(
        room.guesses, room.votes, room.mission,
        room.plannerId, room.insideManId, room.players
      );
    }
  }, [room.voteTimeLeft, room.phase, room.isHost]);

  // Host auto-shows scoreboard or game-over 5s after results
  useEffect(() => {
    if (room.phase === "results" && room.isHost && !scoreboardShownRef.current) {
      scoreboardShownRef.current = true;
      const timeout = setTimeout(() => {
        if (room.isFinalRound) {
          room.showGameOver();
        } else {
          room.showScoreboard();
        }
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [room.phase, room.isHost, room.isFinalRound]);

  // Mid-game join: auto-become spectator
  useEffect(() => {
    if (room.phase !== "lobby" && room.phase !== "gameover") {
      const isInPlayers = room.players.find((p) => p.id === room.playerId);
      const isInSpectators = room.spectators.find((s) => s.id === room.playerId);
      if (!isInPlayers && !isInSpectators) {
        room.joinAsSpectator();
      }
    }
  }, [room.phase, room.players, room.spectators, room.playerId]);

  const blanks = useMemo(() => {
    if (!room.mission) return [];
    return generateBlanks(room.mission.sentence, room.mission.hint, room.hintRevealed);
  }, [room.mission, room.hintRevealed]);

  // Show name entry if no name provided (placed after all hooks)
  if (!confirmedName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-[fadeIn_0.3s_ease-out]">
        <div className="text-center">
          <p className="text-5xl mb-3">&#128142;</p>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            Join Room <span style={{ color: 'var(--accent)' }}>{roomId}</span>
          </h2>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Enter your name to join the game
          </p>
        </div>
        <form onSubmit={handleNameSubmit} className="card w-full max-w-sm flex flex-col gap-3">
          <input
            type="text"
            value={enteredName}
            onChange={(e) => setEnteredName(e.target.value)}
            placeholder="Your name"
            maxLength={16}
            autoFocus
            className="input-field text-center text-lg font-semibold"
          />
          <button
            type="submit"
            disabled={!enteredName.trim()}
            className="btn btn-primary text-lg py-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Join Game
          </button>
        </form>
      </div>
    );
  }

  function handleGuess(guess) {
    room.submitGuess(guess.text);
  }

  function handleVote(targetId) {
    room.submitVote(targetId);
    setHasVoted(true);
  }

  // --- ERROR STATES ---
  if (room.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 animate-[fadeIn_0.3s_ease-out]">
        <div className="text-6xl">
          {room.error === "room_full" ? "\uD83D\uDE45" : "\u26A0\uFE0F"}
        </div>
        <div className="card text-center max-w-sm">
          <h2 className="text-xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
            {room.error === "room_full" ? "Room Full" : "Connection Error"}
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            {room.error === "room_full"
              ? "This room has reached the maximum number of players."
              : "Could not connect to the room. Please check your connection and try again."}
          </p>
          <div className="flex gap-3 justify-center">
            {room.error === "room_full" && (
              <button
                onClick={() => { room.clearError(); room.joinAsSpectator(); }}
                className="btn btn-secondary text-sm px-5 py-2.5"
              >
                Join as Spectator
              </button>
            )}
            <button
              onClick={() => window.location.href = "/"}
              className="btn btn-primary text-sm px-5 py-2.5"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Spectator banner (shown in active phases)
  const spectatorBanner = room.isSpectator && (
    <div
      className="surface rounded-2xl px-4 py-3 text-center mb-4 animate-[fadeIn_0.3s_ease-out]"
      style={{ borderColor: 'var(--accent-alt)' }}
    >
      <p className="text-sm font-bold" style={{ color: 'var(--accent-alt)' }}>
        {"\u{1F440}"} You are watching as a spectator
      </p>
    </div>
  );

  // --- LOBBY ---
  if (room.phase === "lobby") {
    return (
      <Lobby
        roomId={roomId}
        players={room.players}
        spectators={room.spectators}
        isHost={room.isHost}
        settings={room.settings}
        onStart={() => room.startGame(0)}
        onSettingsChange={room.updateSettings}
      />
    );
  }

  // --- PLANNER PHASE ---
  if (room.phase === "planner") {
    const insideManBanner = room.isInsideMan && !room.isPlanner && (
      <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-4 text-center
                      max-w-md mx-auto animate-[bounceIn_0.4s_ease-out]">
        <p className="text-3xl mb-1">{"\u{1F575}\u{FE0F}"}</p>
        <p className="font-bold text-red-600 dark:text-red-400 text-lg">
          You are the INSIDE MAN
        </p>
        <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1">
          Mislead players and avoid getting caught.
        </p>
      </div>
    );

    if (room.isPlanner && !room.isSpectator) {
      return (
        <div className="animate-[fadeIn_0.3s_ease-out]">
          <div className="text-center mb-6">
            <p className="label mb-1">
              Round {room.roundIndex + 1} / {room.settings.totalRounds}
            </p>
            <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              You are the Planner
            </p>
            <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
              Plan the Heist
            </h2>
          </div>
          <EmojiPlanner
            mission={room.mission}
            emojiLimit={room.settings.emojiLimit}
            onSubmit={room.submitEmojiPlan}
          />
        </div>
      );
    }

    const plannerPlayer = room.players.find((p) => p.id === room.plannerId);
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 animate-[fadeIn_0.3s_ease-out]">
        {spectatorBanner}
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Round {room.roundIndex + 1} / {room.settings.totalRounds}
        </p>
        {insideManBanner}
        <div className="text-6xl animate-pulse">{"\u{1F575}\u{FE0F}"}</div>
        <div className="card text-center max-w-md">
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--accent)' }}>{plannerPlayer?.name || "Planner"}</span>{" "}
            is preparing the plan...
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Get ready to guess!
          </p>
        </div>
      </div>
    );
  }

  // --- GUESSING PHASE ---
  if (room.phase === "guessing") {
    const canGuess = !room.isPlanner && !room.isSpectator;

    return (
      <div className="animate-[fadeIn_0.3s_ease-out] flex flex-col gap-4">
        {spectatorBanner}
        <div className="text-center mb-2">
          <p className="label mb-1">
            Round {room.roundIndex + 1} / {room.settings.totalRounds}
          </p>
          <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
            {room.isPlanner ? "Your Plan" : "Crack the Mission"}
          </p>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {room.isPlanner ? "Watch them guess!" : "Guess the Mission"}
          </h2>
        </div>

        {room.isInsideMan && !room.isPlanner && !room.isSpectator && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-center">
            <p className="text-sm font-bold text-red-600 dark:text-red-400">
              {"\u{1F575}\u{FE0F}"} You are the Inside Man — mislead the others!
            </p>
          </div>
        )}

        <EmojiDisplay emojis={room.emojiPlan} />
        <SentenceBlanks blanks={blanks} />

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3 flex flex-col gap-4">
            <Timer
              duration={room.settings.roundTime}
              hintTime={room.hintTime}
              hint={room.mission?.hint || ""}
              onHintReveal={() => {}}
              onTimeUp={() => {}}
              syncedTimeLeft={room.timeLeft}
              hintRevealed={room.hintRevealed}
            />
          </div>
          <div className="w-full md:w-2/3">
            <GuessChat
              guesses={room.guesses}
              onGuess={handleGuess}
              disabled={!canGuess || room.timeLeft <= 0}
              playerName={confirmedName}
            />
          </div>
        </div>

        {(room.isPlanner || room.isSpectator) && (
          <div className="card text-center">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
              {room.isPlanner
                ? "You are the planner \u2014 you cannot guess this round"
                : "Spectators cannot guess"}
            </p>
          </div>
        )}
      </div>
    );
  }

  // --- VOTING PHASE ---
  if (room.phase === "voting") {
    if (room.isPlanner || room.isSpectator) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 animate-[fadeIn_0.3s_ease-out]">
          {spectatorBanner}
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              Voting Phase
            </p>
            <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
              Players are voting...
            </h2>
          </div>
          <div className="text-6xl">{"\u{1F5F3}\u{FE0F}"}</div>
          <div className="card text-center max-w-md">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
              {room.isPlanner ? "As the planner, you sit this vote out." : "Spectators cannot vote."}
            </p>
            <p className="text-2xl font-bold tabular-nums mt-2" style={{ color: 'var(--text-primary)' }}>
              {room.voteTimeLeft}s
            </p>
          </div>
        </div>
      );
    }

    return (
      <VotingScreen
        players={room.players}
        spectators={room.spectators}
        currentPlayerId={room.playerId}
        plannerId={room.plannerId}
        onVote={handleVote}
        hasVoted={hasVoted}
        votes={room.votes}
        voteTimeLeft={room.voteTimeLeft}
      />
    );
  }

  // --- RESULTS PHASE ---
  if (room.phase === "results" && room.results) {
    const r = room.results;
    const insideManPlayer = room.players.find((p) => p.id === r.insideManId);

    return (
      <div className="animate-[fadeIn_0.3s_ease-out] flex flex-col items-center gap-5 mt-4">
        {spectatorBanner}

        <div className="card w-full max-w-lg text-center">
          <p className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--accent)' }}>
            Mission
          </p>
          <p className="text-2xl md:text-3xl font-extrabold capitalize" style={{ color: 'var(--text-primary)' }}>
            {r.mission.sentence}
          </p>
          {r.mission.genre && (
            <span
              className="inline-block mt-2 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider"
              style={{
                background: "var(--bg-surface)",
                color: "var(--accent-alt)",
                border: "2px solid var(--border-light)",
              }}
            >
              {r.mission.genre}
            </span>
          )}
        </div>

        {room.emojiPlan && <div className="text-5xl">{room.emojiPlan}</div>}

        <div className="card w-full max-w-lg text-center">
          {r.winners && r.winners.length > 0 ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-wider text-green-600 mb-3">
                Correct Guessers
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {r.winners.map((name, i) => (
                  <span
                    key={i}
                    className="font-bold px-4 py-1.5 rounded-xl text-base animate-[bounceIn_0.3s_ease-out]"
                    style={{
                      backgroundColor: 'var(--correct-bg)',
                      color: 'var(--correct-text)',
                      animationDelay: `${i * 0.1}s`,
                    }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div>
              <p className="text-3xl mb-2">&#128557;</p>
              <p className="text-base font-bold" style={{ color: 'var(--text-muted)' }}>
                Nobody cracked the mission
              </p>
            </div>
          )}
        </div>

        <div className="card w-full max-w-lg text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-red-500 mb-2">
            Inside Man
          </p>
          <p className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {"\u{1F575}\u{FE0F}"} {insideManPlayer?.name || "Unknown"}
          </p>
          <p
            className={`mt-2 text-sm font-bold ${r.insideManCaught ? "text-green-600" : ""}`}
            style={!r.insideManCaught ? { color: 'var(--timer-low)' } : undefined}
          >
            {r.insideManCaught ? "Caught by the team!" : "Escaped undetected!"}
          </p>
        </div>

        {r.votes && r.votes.length > 0 && (
          <div className="card w-full max-w-lg">
            <p className="text-sm font-semibold uppercase tracking-wider mb-3 text-center" style={{ color: 'var(--text-primary)' }}>
              Votes
            </p>
            <div className="space-y-1.5">
              {r.votes.map((v, i) => {
                const voter = room.players.find((p) => p.id === v.playerId);
                const target = room.players.find((p) => p.id === v.voteTargetId);
                return (
                  <div key={i} className="surface flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg">
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {voter?.name || "?"}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{"\u2192"}</span>
                    <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                      {target?.name || "?"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
          {room.isFinalRound ? "Final results coming up..." : "Scoreboard coming up..."}
        </p>
      </div>
    );
  }

  // --- SCOREBOARD PHASE ---
  if (room.phase === "scoreboard") {
    return (
      <Scoreboard
        players={room.players}
        isHost={room.isHost}
        onNextRound={room.nextRound}
      />
    );
  }

  // --- GAME OVER PHASE ---
  if (room.phase === "gameover") {
    return (
      <Scoreboard
        players={room.players}
        isHost={room.isHost}
        gameOver
        onPlayAgain={room.restartGame}
      />
    );
  }

  // Fallback
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <p className="font-semibold" style={{ color: 'var(--text-muted)' }}>Loading...</p>
    </div>
  );
}
