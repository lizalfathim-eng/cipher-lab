// Shared alphabet text for routines that need to work with the 26 English letters.
export const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

// Convert any numeric shift into the 0–25 range, including negative values.
export function normalizeShift(shift) {
  const numeric = Number(shift);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return ((numeric % 26) + 26) % 26;
}

// Shift one letter while keeping its case; punctuation and digits pass through unchanged.
export function caesarTransformChar(char, shift, decrypt = false) {
  if (!/[A-Za-z]/.test(char)) {
    return char;
  }

  const isUpper = char === char.toUpperCase();
  const alphabetStart = isUpper ? 65 : 97;
  const position = char.charCodeAt(0) - alphabetStart;
  const offset = decrypt ? -shift : shift;
  const transformed = (position + offset + 26) % 26;
  return String.fromCharCode(alphabetStart + transformed);
}

// Encrypt each character independently. map() creates a new result and join() rebuilds the text.
export function caesarEncrypt(message = "", shift = 0) {
  const normalized = normalizeShift(shift);
  return [...message].map((char) => caesarTransformChar(char, normalized, false)).join("");
}

// Decryption uses the same letter transform as encryption, but moves in the opposite direction.
export function caesarDecrypt(message = "", shift = 0) {
  const normalized = normalizeShift(shift);
  return [...message].map((char) => caesarTransformChar(char, normalized, true)).join("");
}

// Try every possible Caesar key. Each result decrypts the original message with one shift from 0 to 25.
export function caesarBruteforce(message = "") {
  return Array.from({ length: 26 }, (_, shift) => ({
    shift,
    plaintext: caesarDecrypt(message, shift),
  }));
}

// Build an educational per-character trace; this is separate from the cipher's output function.
export function generateCaesarStepExample(message = "ATTACK AT DAWN", shift = 3, direction = "encrypt") {
  const sample = message || "ATTACK AT DAWN";
  const normalized = normalizeShift(shift);
  const steps = [...sample].map((char) => {
    if (!/[A-Za-z]/.test(char)) {
      return { original: char, transformed: char, shift: 0, description: "Non-letter preserved as-is." };
    }

    const isUpper = char === char.toUpperCase();
    const alphabetStart = isUpper ? 65 : 97;
    const position = char.charCodeAt(0) - alphabetStart;
    const offset = direction === "decrypt" ? -normalized : normalized;
    const transformedIndex = (position + offset + 26) % 26;
    const transformed = String.fromCharCode(alphabetStart + transformedIndex);

    return {
      original: char,
      transformed,
      shift: normalized,
      description: `${char} (${position}) → ${transformed} (${transformedIndex})`,
    };
  });

  return steps;
}
