// The alphabet is used to express each key letter as a numeric shift from 0 to 25.
export const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

// A valid key is one or more English letters; punctuation and digits are not accepted.
export function isValidVigenereKey(key = "") {
  return typeof key === "string" && /^[A-Za-z]+$/.test(key.trim());
}

// Trim user-entered surrounding whitespace while preserving the keyword itself.
export function normalizeVigenereKey(key = "") {
  return typeof key === "string" ? key.trim() : "";
}

// Repeat a keyword to the requested length for the educational expanded-key display.
export function expandKey(key = "", length = 0) {
  const normalized = normalizeVigenereKey(key).toUpperCase();
  if (!normalized || length <= 0) {
    return "";
  }

  const repeated = [];
  for (let i = 0; i < length; i += 1) {
    repeated.push(normalized[i % normalized.length]);
  }
  return repeated.join("");
}

// Apply a numeric shift to one letter, preserving whether it was uppercase or lowercase.
function shiftLetter(letter, shift) {
  const base = letter === letter.toUpperCase() ? 65 : 97;
  const position = letter.charCodeAt(0) - base;
  const shifted = (position + shift + 26) % 26;
  return String.fromCharCode(base + shifted);
}

// Encrypt letters using successive keyword shifts. Non-letters are copied and do not use a key position.
export function vigenereEncrypt(message = "", key = "") {
  if (!isValidVigenereKey(key)) {
    throw new Error("Vigenère key must contain alphabetic characters only.");
  }

  const normalizedKey = normalizeVigenereKey(key).toUpperCase();
  // keyPosition counts only letters so spaces and punctuation do not advance the keyword.
  let keyPosition = 0;
  let output = "";

  for (const char of message) {
    if (!/[A-Za-z]/.test(char)) {
      output += char;
      continue;
    }

    const shift = normalizedKey.charCodeAt(keyPosition % normalizedKey.length) - 65;
    output += shiftLetter(char, shift);
    keyPosition += 1;
  }

  return output;
}

// Decrypt by subtracting the same repeating keyword shifts used during encryption.
export function vigenereDecrypt(message = "", key = "") {
  if (!isValidVigenereKey(key)) {
    throw new Error("Vigenère key must contain alphabetic characters only.");
  }

  const normalizedKey = normalizeVigenereKey(key).toUpperCase();
  let keyPosition = 0;
  let output = "";

  for (const char of message) {
    if (!/[A-Za-z]/.test(char)) {
      output += char;
      continue;
    }

    const shift = normalizedKey.charCodeAt(keyPosition % normalizedKey.length) - 65;
    output += shiftLetter(char, -shift);
    keyPosition += 1;
  }

  return output;
}

// Prepare a teaching trace and an expanded key; this does not perform the workspace output operation.
export function buildVigenereSteps(message = "", key = "", direction = "encrypt") {
  if (!isValidVigenereKey(key)) {
    return [];
  }

  const normalizedKey = normalizeVigenereKey(key).toUpperCase();
  const alphaCount = [...message].filter((char) => /[A-Za-z]/.test(char)).length;
  const expandedKey = expandKey(normalizedKey, alphaCount);
  const steps = [];
  let keyIndex = 0;

  for (const char of message) {
    if (!/[A-Za-z]/.test(char)) {
      steps.push({ original: char, keyChar: "-", shift: 0, transformed: char, detail: "Non-letter preserved without using key material." });
      continue;
    }

    const keyChar = expandedKey[keyIndex] ?? normalizedKey[keyIndex % normalizedKey.length];
    const shift = keyChar.charCodeAt(0) - 65;
    const transformed = shiftLetter(char, direction === "decrypt" ? -shift : shift);
    steps.push({
      original: char,
      keyChar,
      shift,
      transformed,
      detail: `${char} + ${shift} → ${transformed}`,
    });
    keyIndex += 1;
  }

  return { steps, expandedKey };
}
