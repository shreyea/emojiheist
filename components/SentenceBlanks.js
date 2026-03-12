"use client";

export default function SentenceBlanks({ blanks }) {
  return (
    <div className="card w-full text-center">
      <div className="flex flex-wrap justify-center gap-3">
        {blanks.map((word, i) => {
          const isRevealed = !word.startsWith("_");
          return isRevealed ? (
            <span
              key={i}
              className="text-2xl md:text-3xl font-mono font-extrabold tracking-widest
                         rounded-lg px-3 py-1 animate-[hintReveal_0.4s_ease-out]"
              style={{
                background: "var(--hint-bg)",
                color: "var(--hint-text)",
                border: "3px solid var(--border)",
              }}
            >
              {word}
            </span>
          ) : (
            <span
              key={i}
              className="text-2xl md:text-3xl font-mono font-bold tracking-[0.25em]
                         pb-1 px-1"
              style={{
                color: "var(--text-primary)",
                borderBottom: "3px solid var(--border)",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}
