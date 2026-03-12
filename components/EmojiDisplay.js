"use client";

const emojiSegmenter = (str) =>
  [...new Intl.Segmenter().segment(str)].map((s) => s.segment);

export default function EmojiDisplay({ emojis }) {
  const segments = emojiSegmenter(emojis);

  return (
    <div className="card w-full text-center">
      <p className="label mb-3">The Plan</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {segments.map((seg, i) => (
          <span
            key={i}
            className="text-8xl inline-block cursor-pointer hover:scale-125 transition-transform
                       animate-[popIn_0.3s_ease-out]"
            style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "both" }}
          >
            {seg}
          </span>
        ))}
      </div>
    </div>
  );
}
