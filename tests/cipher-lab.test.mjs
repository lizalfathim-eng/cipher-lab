import test from "node:test";
import assert from "node:assert/strict";

import { caesarEncrypt, caesarDecrypt, normalizeShift, caesarBruteforce } from "../js/caesar.js";
import { vigenereEncrypt, vigenereDecrypt, isValidVigenereKey } from "../js/vigenere.js";
import {
  substitutionEncrypt,
  substitutionDecrypt,
  isValidSubstitutionAlphabet,
  generateRandomSubstitutionAlphabet,
} from "../js/substitution.js";
import { calculateFrequencyDistribution } from "../js/frequency-analysis.js";
import { getTextStatistics } from "../js/text-statistics.js";

// Node's built-in test runner checks the reusable modules without needing a browser.
test("Caesar encryption and decryption work for letters, numbers and punctuation", () => {
  assert.equal(caesarEncrypt("HELLO, WORLD! 123", 3), "KHOOR, ZRUOG! 123");
  assert.equal(caesarDecrypt("KHOOR, ZRUOG! 123", 3), "HELLO, WORLD! 123");
  assert.equal(caesarEncrypt("abcXYZ", 0), "abcXYZ");
  assert.equal(caesarEncrypt("xyz", 25), "wxy");
  assert.equal(normalizeShift(-1), 25);
  assert.equal(normalizeShift(26), 0);
});

test("Caesar round trip preserves the original text and supports all shifts", () => {
  const samples = ["Attack at Dawn", "A! 1 2 3 B?", "", "Mixed CASE 42"];

  // Every valid key must reverse itself, including boundary values and empty text.
  for (const sample of samples) {
    for (let shift = 0; shift < 26; shift += 1) {
      assert.equal(caesarDecrypt(caesarEncrypt(sample, shift), shift), sample);
    }
  }

  const candidates = caesarBruteforce("GUR DHVPX OEBJA");
  assert.equal(candidates.length, 26);
  assert.equal(candidates[13].shift, 13);
  assert.equal(candidates[13].plaintext, "THE QUICK BROWN");
});

test("Vigenère encrypts and decrypts with repeated keys and differing lengths", () => {
  assert.equal(vigenereEncrypt("ATTACKATDAWN", "LEMON"), "LXFOPVEFRNHR");
  assert.equal(vigenereDecrypt("LXFOPVEFRNHR", "LEMON"), "ATTACKATDAWN");
  assert.equal(vigenereEncrypt("HELLO WORLD", "KEY"), "RIJVS UYVJN");
  assert.equal(vigenereDecrypt("RIJVS UYVJN", "KEY"), "HELLO WORLD");
  assert.equal(vigenereDecrypt(vigenereEncrypt("A B C", "AB"), "AB"), "A B C");
  assert.equal(isValidVigenereKey("abc123"), false);
  assert.equal(isValidVigenereKey("LEMON"), true);
  assert.equal(isValidVigenereKey("lemon!"), false);
});

test("Vigenère handles uppercase, lowercase and non-letter characters without consuming the key on spaces", () => {
  const encrypted = vigenereEncrypt("Hello, World! 2026", "Key");
  assert.equal(vigenereDecrypt(encrypted, "Key"), "Hello, World! 2026");
  assert.equal(vigenereEncrypt("abc", "z"), "zab");
  assert.equal(vigenereEncrypt("AbC", "Q"), "QrS");
});

test("Substitution ciphers validate alphabets and preserve case", () => {
  const alphabet = "BCDEFGHIJKLMNOPQRSTUVWXYZA";
  assert.equal(substitutionEncrypt("HELLO WORLD", alphabet), "IFMMP XPSME");
  assert.equal(substitutionDecrypt("IFMMP XPSME", alphabet), "HELLO WORLD");
  assert.equal(substitutionEncrypt("aBc", alphabet), "bCd");
  assert.equal(isValidSubstitutionAlphabet("abcdefghijklmnopqrstuvwxyz"), true);
  assert.equal(isValidSubstitutionAlphabet("ABCDEF"), false);
  assert.equal(isValidSubstitutionAlphabet("ABCDEFghijklmnopqrstuvwxyzz"), false);
  assert.equal(isValidSubstitutionAlphabet("abcdefghijklmnopqrstuvwxyzz"), false);
});

test("Substitution alphabets can be generated and reset to the standard alphabet", () => {
  const random = generateRandomSubstitutionAlphabet();
  assert.equal(random.length, 26);
  assert.equal(new Set(random).size, 26);
  assert.equal(/^[a-z]+$/.test(random), true);

  const inverse = substitutionDecrypt(substitutionEncrypt("CIPHER LAB", random), random);
  assert.equal(inverse, "CIPHER LAB");
});

test("Frequency analysis and text statistics return consistent results", () => {
  const distribution = calculateFrequencyDistribution("ABBAA");
  assert.equal(distribution[0].letter, "a");
  assert.equal(distribution[0].count, 3);
  assert.equal(distribution[1].letter, "b");
  assert.equal(distribution[1].count, 2);

  const stats = getTextStatistics("Hello, world! 123");
  assert.equal(stats.characterCount, 17);
  assert.equal(stats.alphabeticCharacterCount, 10);
  assert.equal(stats.wordCount, 3);
  assert.equal(stats.uniqueLetterCount, 7);
});
