// Summarize the message without changing it: characters, words, unique letters, and letter counts.
export function getTextStatistics(text = "") {
  // Character count includes spaces and punctuation; alphabetic count includes only A–Z.
  const characterCount = text.length;
  const alphabeticCharacterCount = [...text].filter((char) => /[A-Za-z]/.test(char)).length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const uniqueLetters = new Set(
    [...text.toLowerCase()].filter((char) => /[a-z]/.test(char))
  ).size;

  // A set of letters becomes a count table so other views can reuse the per-letter totals.
  const counts = {};
  for (const char of text.toLowerCase()) {
    if (/[a-z]/.test(char)) {
      counts[char] = (counts[char] ?? 0) + 1;
    }
  }

  return {
    characterCount,
    alphabeticCharacterCount,
    wordCount,
    uniqueLetterCount: uniqueLetters,
    letters: counts,
  };
}
