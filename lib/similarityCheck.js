import stringSimilarity from "string-similarity";

/**
 * Check if a guess is similar enough to the mission sentence.
 * Returns true if similarity >= threshold (default 0.9).
 */
export function checkSimilarity(guess, sentence, threshold = 0.9) {
  const similarity = stringSimilarity.compareTwoStrings(
    guess.toLowerCase().trim(),
    sentence.toLowerCase().trim()
  );
  return { match: similarity >= threshold, similarity };
}
