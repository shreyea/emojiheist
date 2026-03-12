"use client";

import { useState, useMemo, useCallback } from "react";
import { missions } from "../../lib/missions";
import { generateBlanks } from "../../lib/generateBlanks";
import { checkSimilarity } from "../../lib/similarityCheck";
import EmojiPlanner from "../../components/EmojiPlanner";
import EmojiDisplay from "../../components/EmojiDisplay";
import SentenceBlanks from "../../components/SentenceBlanks";
import GuessChat from "../../components/GuessChat";
import Timer from "../../components/Timer";

const EMOJI_LIMIT = 4;
const ROUND_DURATION = 45;
const HINT_TIME = 25;
const PLAYER_NAMES = ["Ankit", "Neha", "Harsh", "Priya", "Rohan"];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function GamePage() {
  const [mission] = useState(() => pickRandom(missions));
  const [phase, setPhase] = useState("planning"); // planning | guessing | results
  const [emojiPlan, setEmojiPlan] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [hintRevealed, setHintRevealed] = useState(false);

  const blanks = useMemo(
    () => generateBlanks(mission.sentence, mission.hint, hintRevealed),
    [mission, hintRevealed]
  );

  const handleEmojiSubmit = useCallback((emojis) => {
    setEmojiPlan(emojis);
    setPhase("guessing");
  }, []);

  const handleGuess = useCallback((guess) => {
    // Solo mode: assign a random name to each guess
    const name = pickRandom(PLAYER_NAMES);
    setGuesses((prev) => [...prev, { name, text: guess.text }]);
  }, []);

  const handleHintReveal = useCallback(() => {
    setHintRevealed(true);
  }, []);

  const handleTimeUp = useCallback(() => {
    setPhase("results");
  }, []);

  const results = useMemo(() => {
    if (phase !== "results") return null;
    const correct = [];
    const seen = new Set();
    for (const g of guesses) {
      const { match } = checkSimilarity(g.text, mission.sentence);
      if (match && !seen.has(g.name)) {
        correct.push(g.name);
        seen.add(g.name);
      }
    }
    return correct;
  }, [phase, guesses, mission]);

  function resetGame() {
    window.location.reload();
  }

  // PLANNING PHASE
  if (phase === "planning") {
    return (
      <div className="animate-[fadeIn_0.3s_ease-out]">
        <div className="text-center mb-6">
          <p className="label">Phase 1</p>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            Plan the Heist
          </h2>
        </div>
        <EmojiPlanner
          mission={mission}
          emojiLimit={EMOJI_LIMIT}
          onSubmit={handleEmojiSubmit}
        />
      </div>
    );
  }

  // GUESSING PHASE
  if (phase === "guessing") {
    return (
      <div className="animate-[fadeIn_0.3s_ease-out] flex flex-col gap-4">
        <div className="text-center mb-2">
          <p className="label">Phase 2</p>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            Crack the Mission
          </h2>
        </div>

        <EmojiDisplay emojis={emojiPlan} />
        <SentenceBlanks blanks={blanks} />

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3 flex flex-col gap-4">
            <Timer
              duration={ROUND_DURATION}
              hintTime={HINT_TIME}
              hint={mission.hint}
              onHintReveal={handleHintReveal}
              onTimeUp={handleTimeUp}
            />
          </div>
          <div className="w-full md:w-2/3">
            <GuessChat
              guesses={guesses}
              onGuess={handleGuess}
              disabled={false}
            />
          </div>
        </div>
      </div>
    );
  }

  // RESULTS PHASE
  return (
    <div className="animate-[fadeIn_0.3s_ease-out] flex flex-col items-center gap-6 mt-8">
      <div className="card w-full max-w-lg text-center">
        <p className="label mb-2">Mission</p>
        <p className="text-2xl md:text-3xl font-extrabold capitalize" style={{ color: 'var(--text-primary)' }}>
          {mission.sentence}
        </p>
      </div>

      <div className="text-6xl">{emojiPlan}</div>

      <div className="card w-full max-w-lg text-center">
        {results && results.length > 0 ? (
          <>
            <p className="text-sm font-semibold uppercase tracking-wider text-green-600 mb-4">
              Correct Guessers
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {results.map((name, i) => (
                <span
                  key={i}
                  className="font-bold px-5 py-2 rounded-xl text-lg animate-[bounceIn_0.3s_ease-out]"
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
            <p className="text-4xl mb-3">&#128557;</p>
            <p className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>
              Nobody cracked the mission
            </p>
          </div>
        )}
      </div>

      <button
        onClick={resetGame}
        className="btn btn-primary text-lg px-8 py-3"
      >
        Play Again
      </button>
    </div>
  );
}
