// Tiny Web Audio sound effects — all synth-generated, no audio files needed
let ctx = null;

function ac() {
  if (!ctx && typeof window !== "undefined") {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {}
  }
  return ctx;
}

function tone(freq, dur, type = "sine", vol = 0.09, startOffset = 0) {
  const a = ac();
  if (!a) return;
  try {
    const osc  = a.createOscillator();
    const gain = a.createGain();
    osc.connect(gain);
    gain.connect(a.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, a.currentTime + startOffset);
    gain.gain.setValueAtTime(vol, a.currentTime + startOffset);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      a.currentTime + startOffset + dur
    );
    osc.start(a.currentTime + startOffset);
    osc.stop(a.currentTime + startOffset + dur + 0.02);
  } catch {}
}

export function playTick() {
  tone(900, 0.04, "square", 0.04);
}

export function playCorrectGuess() {
  tone(523, 0.18, "sine", 0.10, 0.0);
  tone(659, 0.18, "sine", 0.10, 0.12);
  tone(784, 0.26, "sine", 0.10, 0.24);
}

export function playVoteStamp() {
  tone(220, 0.12, "square", 0.11, 0.0);
  tone(160, 0.18, "square", 0.08, 0.08);
}

export function playRoundStart() {
  tone(440, 0.14, "sine", 0.09, 0.00);
  tone(554, 0.14, "sine", 0.09, 0.16);
  tone(659, 0.14, "sine", 0.09, 0.32);
  tone(880, 0.28, "sine", 0.11, 0.48);
}

export function playTimerUrgent() {
  tone(1100, 0.06, "square", 0.06);
}
