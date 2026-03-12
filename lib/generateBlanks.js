/**
 * Generate blanks for a mission sentence.
 * Each word becomes underscores matching its letter count.
 * If hintRevealed is true, the hint word is shown instead of blanks.
 */
export function generateBlanks(sentence, hint, hintRevealed) {
  const words = sentence.split(" ");
  return words.map((word) => {
    if (hintRevealed && word.toLowerCase() === hint.toLowerCase()) {
      return hint.charAt(0).toUpperCase() + hint.slice(1);
    }
    return "_".repeat(word.length);
  });
}
