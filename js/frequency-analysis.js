// Approximate English letter percentages used as a comparison baseline in the chart.
export const ENGLISH_FREQUENCY = {
  a: 8.167,
  b: 1.492,
  c: 2.782,
  d: 4.253,
  e: 12.702,
  f: 2.228,
  g: 2.015,
  h: 6.094,
  i: 6.966,
  j: 0.153,
  k: 0.772,
  l: 4.025,
  m: 2.406,
  n: 6.749,
  o: 7.507,
  p: 1.929,
  q: 0.095,
  r: 5.987,
  s: 6.327,
  t: 9.056,
  u: 2.758,
  v: 0.978,
  w: 2.360,
  x: 0.150,
  y: 1.974,
  z: 0.074,
};

// Count each English letter without treating uppercase and lowercase as different letters.
export function countAlphabeticCharacters(text = "") {
  const counts = {};
  for (const char of text.toLowerCase()) {
    if (/^[a-z]$/.test(char)) {
      counts[char] = (counts[char] ?? 0) + 1;
    }
  }
  return counts;
}

// Convert letter counts into percentages of only the alphabetic characters in the text.
export function calculateFrequencyDistribution(text = "") {
  const counts = countAlphabeticCharacters(text);
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
  const totalAlphabetic = alphabet.reduce((sum, letter) => sum + (counts[letter] ?? 0), 0);

  if (totalAlphabetic === 0) {
    return alphabet.map((letter) => ({ letter, count: 0, percentage: 0 }));
  }

  return alphabet.map((letter) => {
    const count = counts[letter] ?? 0;
    return {
      letter,
      count,
      percentage: (count / totalAlphabetic) * 100,
    };
  });
}

// Return the baseline in the same letter-by-letter shape as the measured distribution.
export function getEnglishFrequencyBaseline() {
  return "abcdefghijklmnopqrstuvwxyz".split("").map((letter) => ({
    letter,
    percentage: ENGLISH_FREQUENCY[letter],
  }));
}
