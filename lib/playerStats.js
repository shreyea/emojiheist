const STORAGE_KEY = "emoji-heist-stats";

export function getPlayerStats() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function updatePlayerStats({ name, won, points }) {
  if (typeof window === "undefined") return;
  const existing = getPlayerStats() || {
    name: name || "Player",
    gamesPlayed: 0,
    gamesWon: 0,
    totalPoints: 0,
  };
  existing.name = name || existing.name;
  existing.gamesPlayed += 1;
  if (won) existing.gamesWon += 1;
  existing.totalPoints += points || 0;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return existing;
}

export function resetPlayerStats() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
