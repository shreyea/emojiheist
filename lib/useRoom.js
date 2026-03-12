"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getSupabase } from "./supabase";
import { missions } from "./missions";
import { checkSimilarity } from "./similarityCheck";
import { updatePlayerStats } from "./playerStats";

const DEFAULT_SETTINGS = {
  emojiLimit: 4,
  roundTime: 45,
  totalRounds: 5,
  isPublic: true,
};
const HINT_FRACTION = 25 / 45;
const VOTE_DURATION = 15;
const MAX_PLAYERS = 8;

function getOrCreatePlayerId() {
  if (typeof window === "undefined") return Math.random().toString(36).slice(2, 10);
  let id = localStorage.getItem("emoji-heist-player-id");
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10);
    localStorage.setItem("emoji-heist-player-id", id);
  }
  return id;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useRoom(roomId, playerName) {
  const channelRef = useRef(null);
  const registryChannelRef = useRef(null);
  const timerRef = useRef(null);
  const voteTimerRef = useRef(null);
  const playerId = useRef(getOrCreatePlayerId());

  const [players, setPlayers] = useState([]);
  const [spectators, setSpectators] = useState([]);
  const [phase, setPhase] = useState("lobby");
  const [plannerId, setPlannerId] = useState(null);
  const [insideManId, setInsideManId] = useState(null);
  const [mission, setMission] = useState(null);
  const [emojiPlan, setEmojiPlan] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.roundTime);
  const [votes, setVotes] = useState([]);
  const [voteTimeLeft, setVoteTimeLeft] = useState(VOTE_DURATION);
  const [results, setResults] = useState(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [error, setError] = useState(null);

  // Round start time for local timer calculation
  const [roundStartTime, setRoundStartTime] = useState(null);
  const [voteStartTime, setVoteStartTime] = useState(null);

  const myRole = spectators.find((s) => s.id === playerId.current)
    ? "spectator"
    : "player";
  const isHost = players.length > 0 && players[0].id === playerId.current;
  const isPlanner = plannerId === playerId.current;
  const isInsideMan = insideManId === playerId.current;
  const isSpectator = myRole === "spectator";
  const isFinalRound = roundIndex >= settings.totalRounds - 1;
  const hintTime = Math.round(settings.roundTime * HINT_FRACTION);

  // Local round timer — clients calculate from roundStartTime
  useEffect(() => {
    if (!roundStartTime || phase !== "guessing") return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - roundStartTime) / 1000);
      const remaining = Math.max(0, settings.roundTime - elapsed);
      setTimeLeft(remaining);
    }, 250);
    return () => clearInterval(interval);
  }, [roundStartTime, phase, settings.roundTime]);

  // Local vote timer — clients calculate from voteStartTime
  useEffect(() => {
    if (!voteStartTime || phase !== "voting") return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - voteStartTime) / 1000);
      const remaining = Math.max(0, VOTE_DURATION - elapsed);
      setVoteTimeLeft(remaining);
    }, 250);
    return () => clearInterval(interval);
  }, [voteStartTime, phase]);

  // Helper: build full sync payload (host only)
  function buildSyncPayload() {
    return {
      players, spectators, phase, plannerId, insideManId, mission,
      emojiPlan, guesses, hintRevealed, timeLeft, votes, voteTimeLeft,
      results, roundIndex, settings, roundStartTime, voteStartTime,
    };
  }

  // --- Room Registry (Supabase Presence) ---
  // Host tracks room in lobby-registry channel so /rooms page can discover it
  useEffect(() => {
    if (!isHost || !roomId) return;
    if (!settings.isPublic) {
      // If private, leave registry
      if (registryChannelRef.current) {
        getSupabase().removeChannel(registryChannelRef.current);
        registryChannelRef.current = null;
      }
      return;
    }

    const supabase = getSupabase();
    const channel = supabase.channel("lobby-registry", {
      config: { presence: { key: roomId } },
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          roomId,
          hostName: playerName,
          playerCount: players.length,
          maxPlayers: MAX_PLAYERS,
          phase,
          isPublic: true,
        });
      }
    });

    registryChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      registryChannelRef.current = null;
    };
  }, [isHost, roomId, settings.isPublic]);

  // Host updates presence when relevant state changes
  useEffect(() => {
    if (!isHost || !registryChannelRef.current || !settings.isPublic) return;
    registryChannelRef.current.track({
      roomId,
      hostName: playerName,
      playerCount: players.length,
      maxPlayers: MAX_PLAYERS,
      phase,
      isPublic: true,
    });
  }, [isHost, players.length, phase, settings.isPublic, roomId, playerName]);

  // Subscribe to room channel
  useEffect(() => {
    if (!roomId || !playerName) return;

    const supabase = getSupabase();
    const channel = supabase.channel(`room-${roomId}`, {
      config: { broadcast: { self: true } },
    });

    channel
      .on("broadcast", { event: "player_join" }, ({ payload }) => {
        if (payload.role === "spectator") {
          setSpectators((prev) => {
            if (prev.find((s) => s.id === payload.id)) return prev;
            return [...prev, payload];
          });
        } else {
          setPlayers((prev) => {
            if (prev.find((p) => p.id === payload.id)) return prev;
            return [...prev, { ...payload, score: payload.score ?? 0 }];
          });
        }
      })
      .on("broadcast", { event: "player_leave" }, ({ payload }) => {
        setPlayers((prev) => prev.filter((p) => p.id !== payload.id));
        setSpectators((prev) => prev.filter((s) => s.id !== payload.id));
      })
      .on("broadcast", { event: "player_reconnect" }, ({ payload }) => {
        setPlayers((prev) => {
          const existing = prev.find((p) => p.id === payload.id);
          if (existing) return prev.map((p) => p.id === payload.id ? { ...p, name: payload.name } : p);
          return [...prev, { ...payload, score: payload.score ?? 0 }];
        });
      })
      .on("broadcast", { event: "sync_state" }, ({ payload }) => {
        if (payload.players) setPlayers(payload.players);
        if (payload.spectators) setSpectators(payload.spectators);
        if (payload.phase) setPhase(payload.phase);
        if (payload.plannerId !== undefined) setPlannerId(payload.plannerId);
        if (payload.insideManId !== undefined) setInsideManId(payload.insideManId);
        if (payload.mission !== undefined) setMission(payload.mission);
        if (payload.emojiPlan !== undefined) setEmojiPlan(payload.emojiPlan);
        if (payload.guesses) setGuesses(payload.guesses);
        if (payload.hintRevealed !== undefined) setHintRevealed(payload.hintRevealed);
        if (payload.timeLeft !== undefined) setTimeLeft(payload.timeLeft);
        if (payload.votes) setVotes(payload.votes);
        if (payload.voteTimeLeft !== undefined) setVoteTimeLeft(payload.voteTimeLeft);
        if (payload.results !== undefined) setResults(payload.results);
        if (payload.roundIndex !== undefined) setRoundIndex(payload.roundIndex);
        if (payload.settings) setSettings(payload.settings);
        if (payload.roundStartTime !== undefined) setRoundStartTime(payload.roundStartTime);
        if (payload.voteStartTime !== undefined) setVoteStartTime(payload.voteStartTime);
        setError(null);
      })
      .on("broadcast", { event: "request_sync" }, () => {
        // Only host responds — handled in separate effect
      })
      .on("broadcast", { event: "start_game" }, ({ payload }) => {
        setMission(payload.mission);
        setPlannerId(payload.plannerId);
        setInsideManId(payload.insideManId);
        setPhase("planner");
        setEmojiPlan("");
        setGuesses([]);
        setVotes([]);
        setHintRevealed(false);
        setTimeLeft(payload.roundTime ?? DEFAULT_SETTINGS.roundTime);
        setVoteTimeLeft(VOTE_DURATION);
        setResults(null);
        setRoundIndex(payload.roundIndex ?? 0);
        setRoundStartTime(null);
        setVoteStartTime(null);
        if (payload.settings) setSettings(payload.settings);
        setError(null);
      })
      .on("broadcast", { event: "emoji_plan" }, ({ payload }) => {
        setEmojiPlan(payload.emojiPlan);
        setPhase("guessing");
      })
      .on("broadcast", { event: "guess" }, ({ payload }) => {
        setGuesses((prev) => [...prev, payload]);
      })
      .on("broadcast", { event: "round_start_time" }, ({ payload }) => {
        setRoundStartTime(payload.startTime);
        setTimeLeft(payload.roundTime);
      })
      .on("broadcast", { event: "hint_reveal" }, () => {
        setHintRevealed(true);
      })
      .on("broadcast", { event: "timer_end" }, () => {
        setTimeLeft(0);
        setRoundStartTime(null);
      })
      .on("broadcast", { event: "start_voting" }, () => {
        setPhase("voting");
        setVoteTimeLeft(VOTE_DURATION);
      })
      .on("broadcast", { event: "vote" }, ({ payload }) => {
        setVotes((prev) => {
          const filtered = prev.filter((v) => v.playerId !== payload.playerId);
          return [...filtered, payload];
        });
      })
      .on("broadcast", { event: "vote_start_time" }, ({ payload }) => {
        setVoteStartTime(payload.startTime);
        setVoteTimeLeft(VOTE_DURATION);
      })
      .on("broadcast", { event: "vote_end" }, () => {
        setVoteTimeLeft(0);
        setVoteStartTime(null);
      })
      .on("broadcast", { event: "results" }, ({ payload }) => {
        setResults(payload);
        setPhase("results");
      })
      .on("broadcast", { event: "score_update" }, ({ payload }) => {
        setPlayers((prev) =>
          prev.map((p) => ({ ...p, score: payload.scores[p.id] ?? p.score }))
        );
      })
      .on("broadcast", { event: "show_scoreboard" }, () => {
        setPhase("scoreboard");
      })
      .on("broadcast", { event: "game_over" }, () => {
        setPhase("gameover");
      })
      .on("broadcast", { event: "game_restart" }, () => {
        setPhase("lobby");
        setRoundIndex(0);
        setResults(null);
        setGuesses([]);
        setVotes([]);
        setEmojiPlan("");
        setMission(null);
        setPlannerId(null);
        setInsideManId(null);
        setRoundStartTime(null);
        setVoteStartTime(null);
        setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
        setError(null);
      })
      .on("broadcast", { event: "settings_update" }, ({ payload }) => {
        setSettings(payload.settings);
      })
      .on("broadcast", { event: "planner_reassigned" }, ({ payload }) => {
        setPlannerId(payload.plannerId);
      })
      .on("broadcast", { event: "room_full" }, ({ payload }) => {
        if (payload.targetId === playerId.current) {
          setError("room_full");
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setError(null);

          // Check reconnect
          const savedRoom = typeof window !== "undefined"
            ? localStorage.getItem("emoji-heist-room")
            : null;
          let isReconnect = false;
          if (savedRoom) {
            try {
              const parsed = JSON.parse(savedRoom);
              if (parsed.roomId === roomId && parsed.id === playerId.current) {
                isReconnect = true;
              }
            } catch {}
          }

          if (isReconnect) {
            channel.send({
              type: "broadcast",
              event: "player_reconnect",
              payload: { id: playerId.current, name: playerName },
            });
            channel.send({
              type: "broadcast",
              event: "request_sync",
              payload: { requesterId: playerId.current },
            });
          } else {
            channel.send({
              type: "broadcast",
              event: "player_join",
              payload: { id: playerId.current, name: playerName, score: 0, role: "player" },
            });
          }

          // Persist room info
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "emoji-heist-room",
              JSON.stringify({ roomId, id: playerId.current, name: playerName })
            );
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setError("connection_error");
        }
      });

    channelRef.current = channel;

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (voteTimerRef.current) clearInterval(voteTimerRef.current);
      channel.send({
        type: "broadcast",
        event: "player_leave",
        payload: { id: playerId.current },
      });
      getSupabase().removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, playerName]);

  // Host: respond to sync requests
  useEffect(() => {
    if (!isHost || !channelRef.current) return;
    const channel = channelRef.current;
    const handler = () => {
      channel.send({
        type: "broadcast",
        event: "sync_state",
        payload: buildSyncPayload(),
      });
    };
    channel.on("broadcast", { event: "request_sync" }, handler);
    return () => {};
  }, [isHost, players, spectators, phase, plannerId, insideManId, mission,
      emojiPlan, guesses, hintRevealed, timeLeft, votes, voteTimeLeft,
      results, roundIndex, settings, roundStartTime, voteStartTime]);

  // Host: detect if planner disconnects and reassign
  useEffect(() => {
    if (!isHost || phase === "lobby" || phase === "gameover" || !plannerId) return;
    const plannerStillHere = players.find((p) => p.id === plannerId);
    if (!plannerStillHere && players.length > 0 && channelRef.current) {
      const newPlanner = players[0];
      channelRef.current.send({
        type: "broadcast",
        event: "planner_reassigned",
        payload: { plannerId: newPlanner.id },
      });
    }
  }, [isHost, players, plannerId, phase]);

  // Update player stats on game over
  useEffect(() => {
    if (phase !== "gameover") return;
    const me = players.find((p) => p.id === playerId.current);
    if (!me) return;
    const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
    const won = sorted[0]?.id === playerId.current;
    updatePlayerStats({ name: playerName, won, points: me.score || 0 });
  }, [phase]);

  // --- ACTIONS ---

  const startGame = useCallback(
    (nextRoundIndex) => {
      if (!channelRef.current) return;
      const idx = typeof nextRoundIndex === "number" ? nextRoundIndex : 0;
      const activePlayers = players.filter((p) => !spectators.find((s) => s.id === p.id));
      if (activePlayers.length < 2) return;

      const plannerIdx = idx % activePlayers.length;
      const planner = activePlayers[plannerIdx];
      const candidates = activePlayers.filter((p) => p.id !== planner.id);
      const insideMan = pickRandom(candidates);
      const chosenMission = pickRandom(missions);

      channelRef.current.send({
        type: "broadcast",
        event: "start_game",
        payload: {
          mission: chosenMission,
          plannerId: planner.id,
          insideManId: insideMan.id,
          roundIndex: idx,
          roundTime: settings.roundTime,
          settings,
        },
      });
    },
    [players, spectators, settings]
  );

  const submitEmojiPlan = useCallback((emojis) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "emoji_plan",
      payload: { emojiPlan: emojis },
    });
  }, []);

  const submitGuess = useCallback(
    (text) => {
      if (!channelRef.current) return;
      channelRef.current.send({
        type: "broadcast",
        event: "guess",
        payload: { name: playerName, text, playerId: playerId.current },
      });
    },
    [playerName]
  );

  // Timer: host broadcasts start time once instead of every-second ticks
  const startTimer = useCallback(() => {
    if (!isHost || !channelRef.current) return;

    const startTime = Date.now();
    const hintAt = settings.roundTime - hintTime;

    // Broadcast start time to all clients
    channelRef.current.send({
      type: "broadcast",
      event: "round_start_time",
      payload: { startTime, roundTime: settings.roundTime },
    });

    // Host still runs an interval for authoritative events (hint + end)
    let hintSent = false;
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = settings.roundTime - elapsed;

      if (remaining <= hintAt && !hintSent) {
        hintSent = true;
        channelRef.current.send({ type: "broadcast", event: "hint_reveal", payload: {} });
      }

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        channelRef.current.send({ type: "broadcast", event: "timer_end", payload: {} });
      }
    }, 1000);
  }, [isHost, settings.roundTime, hintTime]);

  const startVoting = useCallback(() => {
    if (!isHost || !channelRef.current) return;
    channelRef.current.send({ type: "broadcast", event: "start_voting", payload: {} });

    // Broadcast vote start time
    const startTime = Date.now();
    channelRef.current.send({
      type: "broadcast",
      event: "vote_start_time",
      payload: { startTime },
    });

    // Host runs authoritative end event
    let ended = false;
    voteTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (elapsed >= VOTE_DURATION && !ended) {
        ended = true;
        clearInterval(voteTimerRef.current);
        voteTimerRef.current = null;
        channelRef.current.send({ type: "broadcast", event: "vote_end", payload: {} });
      }
    }, 1000);
  }, [isHost]);

  const submitVote = useCallback((voteTargetId) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "vote",
      payload: { playerId: playerId.current, voteTargetId },
    });
  }, []);

  const evaluateResults = useCallback(
    (allGuesses, allVotes, currentMission, currentPlannerId, currentInsideManId, currentPlayers) => {
      if (!isHost || !channelRef.current || !currentMission) return;

      const winners = [];
      const winnerIds = new Set();
      const seenNames = new Set();
      for (const g of allGuesses) {
        const { match } = checkSimilarity(g.text, currentMission.sentence);
        if (match && !seenNames.has(g.name)) {
          winners.push(g.name);
          seenNames.add(g.name);
          if (g.playerId) winnerIds.add(g.playerId);
        }
      }

      const voteCounts = {};
      for (const v of allVotes) {
        voteCounts[v.voteTargetId] = (voteCounts[v.voteTargetId] || 0) + 1;
      }
      let maxVotes = 0;
      let votedOutId = null;
      for (const [id, count] of Object.entries(voteCounts)) {
        if (count > maxVotes) { maxVotes = count; votedOutId = id; }
      }
      const insideManCaught = votedOutId === currentInsideManId;

      const scoreDeltas = {};
      for (const p of currentPlayers) scoreDeltas[p.id] = 0;

      for (const g of allGuesses) {
        const { match } = checkSimilarity(g.text, currentMission.sentence);
        if (match && g.playerId && scoreDeltas[g.playerId] !== undefined) {
          scoreDeltas[g.playerId] = 5;
        }
      }

      if (winners.length > 0 && currentPlannerId) {
        scoreDeltas[currentPlannerId] = (scoreDeltas[currentPlannerId] || 0) + 3;
      }

      if (insideManCaught) {
        for (const p of currentPlayers) {
          if (p.id !== currentInsideManId) {
            scoreDeltas[p.id] = (scoreDeltas[p.id] || 0) + 2;
          }
        }
      } else if (currentInsideManId) {
        scoreDeltas[currentInsideManId] = (scoreDeltas[currentInsideManId] || 0) + 6;
      }

      const newScores = {};
      for (const p of currentPlayers) {
        newScores[p.id] = (p.score || 0) + (scoreDeltas[p.id] || 0);
      }

      channelRef.current.send({
        type: "broadcast",
        event: "score_update",
        payload: { scores: newScores },
      });
      channelRef.current.send({
        type: "broadcast",
        event: "results",
        payload: {
          mission: currentMission, winners, insideManId: currentInsideManId,
          insideManCaught, votedOutId, votes: allVotes, scoreDeltas,
        },
      });
    },
    [isHost]
  );

  const showScoreboard = useCallback(() => {
    if (!isHost || !channelRef.current) return;
    channelRef.current.send({ type: "broadcast", event: "show_scoreboard", payload: {} });
  }, [isHost]);

  const showGameOver = useCallback(() => {
    if (!isHost || !channelRef.current) return;
    channelRef.current.send({ type: "broadcast", event: "game_over", payload: {} });
  }, [isHost]);

  const nextRound = useCallback(() => {
    if (!isHost) return;
    startGame(roundIndex + 1);
  }, [isHost, roundIndex, startGame]);

  const restartGame = useCallback(() => {
    if (!isHost || !channelRef.current) return;
    channelRef.current.send({ type: "broadcast", event: "game_restart", payload: {} });
  }, [isHost]);

  const updateSettings = useCallback((newSettings) => {
    if (!isHost || !channelRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "settings_update",
      payload: { settings: newSettings },
    });
  }, [isHost]);

  const joinAsSpectator = useCallback(() => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "player_join",
      payload: { id: playerId.current, name: playerName, role: "spectator" },
    });
  }, [playerName]);

  const clearError = useCallback(() => setError(null), []);

  return {
    players, spectators, phase, plannerId, insideManId, mission, emojiPlan,
    guesses, hintRevealed, timeLeft, votes, voteTimeLeft, results, roundIndex,
    settings, playerId: playerId.current, isHost, isPlanner, isInsideMan,
    isSpectator, isFinalRound, roomId, hintTime, error,
    roundStartTime, voteStartTime,
    startGame, submitEmojiPlan, submitGuess, startTimer, startVoting,
    submitVote, evaluateResults, showScoreboard,
    showGameOver, nextRound, restartGame, updateSettings, joinAsSpectator,
    clearError,
    VOTE_DURATION, MAX_PLAYERS,
  };
}
