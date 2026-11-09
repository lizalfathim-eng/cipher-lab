// The standard alphabet defines the position of each plaintext letter in the key.
export const STANDARD_ALPHABET = "abcdefghijklmnopqrstuvwxyz";

// A key must provide exactly one unique replacement for every English letter.
export function isValidSubstitutionAlphabet(alphabet = "") {
  if (typeof alphabet !== "string") {
    return false;
  }

  const sanitized = alphabet.replace(/[^A-Za-z]/g, "");
  if (sanitized.length !== 26) {
    return false;
  }

  const lower = sanitized.toLowerCase();
  return new Set(lower.split("")).size === 26 && /^[a-z]{26}$/.test(lower);
}

// Remove surrounding whitespace and non-letters before validating or building a key map.
export function normalizeSubstitutionAlphabet(alphabet = "") {
  return typeof alphabet === "string" ? alphabet.trim().replace(/[^A-Za-z]/g, "") : "";
}

// Shuffle letters in place using Fisher–Yates, which keeps every letter exactly once.
export function generateRandomSubstitutionAlphabet() {
  const letters = STANDARD_ALPHABET.split("");
  for (let i = letters.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters.join("");
}

// Create the forward map: standard alphabet position -> replacement alphabet position.
export function buildSubstitutionMap(substitutionAlphabet = STANDARD_ALPHABET) {
  const normalized = normalizeSubstitutionAlphabet(substitutionAlphabet).toLowerCase();
  if (!isValidSubstitutionAlphabet(normalized)) {
    throw new Error("Invalid substitution alphabet. Use exactly 26 unique letters.");
  }

  return Object.fromEntries(
    STANDARD_ALPHABET.split("").map((plainLetter, index) => [plainLetter, normalized[index]])
  );
}

// Reverse the forward map so ciphertext letters can be mapped back to plaintext.
export function buildInverseSubstitutionMap(substitutionAlphabet = STANDARD_ALPHABET) {
  const mapping = buildSubstitutionMap(substitutionAlphabet);
  return Object.fromEntries(
    Object.entries(mapping).map(([plainLetter, cipherLetter]) => [cipherLetter, plainLetter])
  );
}

// Replace each letter through the forward map; retain case and leave non-letters untouched.
export function substitutionEncrypt(message = "", substitutionAlphabet = STANDARD_ALPHABET) {
  const mapping = buildSubstitutionMap(substitutionAlphabet);
  let output = "";

  for (const char of message) {
    if (!/[A-Za-z]/.test(char)) {
      output += char;
      continue;
    }

    const lower = char.toLowerCase();
    const cipher = mapping[lower];
    output += char === char.toUpperCase() ? cipher.toUpperCase() : cipher;
  }

  return output;
}

// Use the inverse map to decrypt while preserving case and non-alphabetic characters.
export function substitutionDecrypt(message = "", substitutionAlphabet = STANDARD_ALPHABET) {
  const inverseMap = buildInverseSubstitutionMap(substitutionAlphabet);
  let output = "";

  for (const char of message) {
    if (!/[A-Za-z]/.test(char)) {
      output += char;
      continue;
    }

    const lower = char.toLowerCase();
    const plain = inverseMap[lower];
    output += char === char.toUpperCase() ? plain.toUpperCase() : plain;
  }

  return output;
}
