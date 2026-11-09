import { caesarEncrypt, caesarDecrypt, caesarBruteforce } from "./caesar.js";
import { vigenereEncrypt, vigenereDecrypt, isValidVigenereKey, buildVigenereSteps } from "./vigenere.js";
import {
  substitutionEncrypt,
  substitutionDecrypt,
  isValidSubstitutionAlphabet,
  generateRandomSubstitutionAlphabet,
  STANDARD_ALPHABET,
} from "./substitution.js";
import { calculateFrequencyDistribution, getEnglishFrequencyBaseline } from "./frequency-analysis.js";
import { getTextStatistics } from "./text-statistics.js";

// This small state object is the UI's source of truth for the selected cipher and operation.
const state = {
  cipher: "caesar",
  mode: "encrypt",
};

// Cache the HTML controls once so event handlers and render functions can reuse them.
const tabs = [...document.querySelectorAll(".tab")];
const panels = [...document.querySelectorAll(".cipher-panel")];
const modeSelect = document.getElementById("mode-select");
const messageInput = document.getElementById("message-input");
const outputText = document.getElementById("output-text");
const caesarShiftInput = document.getElementById("caesar-shift");
const caesarShiftValue = document.getElementById("caesar-shift-value");
const vigenereKeyInput = document.getElementById("vigenere-key");
const vigenereStatus = document.getElementById("vigenere-status");
const substitutionKeyInput = document.getElementById("substitution-key");
const substitutionPreview = document.getElementById("substitution-preview");
const cipherDetails = document.getElementById("cipher-details");
const cipherExplanation = document.getElementById("cipher-explanation");
const caesarAlphabetMap = document.getElementById("caesar-alphabet-map");
const caesarDirection = document.getElementById("caesar-direction");
const analysisPanel = document.getElementById("analysis-panel");
const bruteforcePanel = document.getElementById("bruteforce-panel");
const frequencyChart = document.getElementById("frequency-chart");
const bruteForceCandidates = document.getElementById("bruteforce-candidates");
const textStatistics = document.getElementById("text-statistics");

// Keep learning copy in one place so changing the cipher updates the explanation consistently.
const cipherDescriptions = {
  caesar: {
    title: "Caesar Cipher",
    summary:
      "A Caesar cipher shifts each letter by a fixed number of positions in the alphabet. It is historically important and easy to teach, but it is only a single-shift substitution scheme and breaks quickly under frequency analysis.",
    explanation: [
      "The key is a shift value between 0 and 25.",
      "Each alphabetic character is moved forward or backward by the same offset.",
      "Encryption adds the shift; decryption subtracts it.",
      "Spaces, punctuation and numbers remain unchanged.",
      "A shift of 3 turns A into D, which is why the classic example 'ATTACK' becomes 'DWWDFN'.",
    ],
  },
  vigenere: {
    title: "Vigenère Cipher",
    summary:
      "A Vigenère cipher uses a keyword to vary the shift for each letter, making the output resistant to simple Caesar frequency attacks. It was considered a strong historical method before modern cryptanalytic techniques were developed.",
    explanation: [
      "The key must be alphabetic and is repeated across the message as needed.",
      "Only alphabetic letters consume key positions, while spaces and punctuation are left untouched.",
      "Each letter is shifted by the corresponding key letter's position in the alphabet.",
      "Decryption reverses each shift using the same key stream.",
      "Its weakness is that repeating patterns in the key can still leak structure under analysis.",
    ],
  },
  substitution: {
    title: "Monoalphabetic Substitution",
    summary:
      "A monoalphabetic substitution cipher swaps the alphabet with another 26-letter permutation. It hides direct letter matches but preserves the overall frequency profile of the language.",
    explanation: [
      "The key is a 26-letter substitution alphabet containing each letter exactly once.",
      "Plain letters map to their corresponding cipher letters using the custom alphabet.",
      "The same mapping is inverted during decryption.",
      "Case is preserved because uppercase and lowercase are treated separately.",
      "This is still vulnerable to frequency analysis because the letter statistics remain recognizably English.",
    ],
  },
};

// Switch the selected cipher tab and its key controls, then redraw views that depend on the selection.
function setActiveCipher(nextCipher) {
  state.cipher = nextCipher;
  tabs.forEach((tab) => {
    const active = tab.dataset.cipher === nextCipher;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  panels.forEach((panel) => {
    const active = panel.dataset.panel === nextCipher;
    panel.classList.toggle("is-active", active);
  });

  updateModeText();
  renderAll();
}

// Keep the cipher-specific key controls in a usable state when switching between tabs.
function updateModeText() {
  const isSubstitution = state.cipher === "substitution";
  if (modeSelect.value === "decrypt" && state.cipher === "caesar") {
    modeSelect.value = "decrypt";
  }
  if (state.cipher === "caesar" || state.cipher === "vigenere") {
    modeSelect.disabled = false;
  } else {
    modeSelect.disabled = false;
  }

  if (isSubstitution) {
    substitutionKeyInput.value = substitutionKeyInput.value || "QWERTYUIOPASDFGHJKLZXCVBNM";
  }
}

// Show a clear message beside the Vigenère key instead of trying to encrypt with an invalid keyword.
function validateVigenereKey() {
  const key = vigenereKeyInput.value.trim();
  if (!key) {
    vigenereStatus.textContent = "Keyword is required for Vigenère operations.";
    return false;
  }

  if (!isValidVigenereKey(key)) {
    vigenereStatus.textContent = "Keyword must contain alphabetic characters only.";
    return false;
  }

  vigenereStatus.textContent = `Keyword accepted: ${key}`;
  return true;
}

// Return both a validity flag and a message so the interface can explain an invalid substitution key.
function validateSubstitutionAlphabet() {
  const key = substitutionKeyInput.value.trim();
  if (!key) {
    return { valid: false, message: "A substitution alphabet is required." };
  }

  if (!isValidSubstitutionAlphabet(key)) {
    return {
      valid: false,
      message: "Alphabet must contain exactly 26 unique letters (A-Z or a-z).",
    };
  }

  return { valid: true, message: "Alphabet accepted." };
}

// Build the visible standard-to-custom alphabet comparison from the current substitution key.
function renderSubstitutionPreview() {
  const alphabet = substitutionKeyInput.value.trim() || STANDARD_ALPHABET;
  const previewRows = `ABCDEFGHIJKLMNOPQRSTUVWXYZ`.split("").map((letter) => {
    const index = letter.toLowerCase().charCodeAt(0) - 97;
    const replacement = alphabet.toLowerCase()[index] || "";
    return `<span class="preview-letter" title="${letter} → ${replacement}">${letter}</span>`;
  }).join("");

  const substituteRows = alphabet.toUpperCase().split("").map((letter) => `<span class="preview-letter">${letter}</span>`).join("");

  substitutionPreview.innerHTML = `
    <div>
      <div class="preview-label">Standard alphabet</div>
      <div class="preview-row">${previewRows}</div>
    </div>
    <div>
      <div class="preview-label">Substitution alphabet</div>
      <div class="preview-row">${substituteRows}</div>
    </div>
  `;
}

// Use a short teaching example when the user has not typed a message yet.
function getMessageSample() {
  return messageInput.value.trim() || "ATTACK AT DAWN";
}

// Render the selected cipher's visual mapping or per-character learning trace.
function renderCipherDetails() {
  const sampleMessage = getMessageSample();
  const description = cipherDescriptions[state.cipher];

  if (state.cipher === "caesar") {
    const shift = Number(caesarShiftInput.value);
    const originalAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const shiftedAlphabet = [...originalAlphabet]
      .map((letter, index) => originalAlphabet[(index + shift) % 26])
      .join("");

    caesarDirection.textContent = state.mode === "encrypt"
      ? `Encrypt: original → shifted · Shift ${shift}`
      : `Decrypt: shifted → original · Shift ${shift}`;
    // Generate aligned rows from the same indices so each pair shows one Caesar mapping.
    caesarAlphabetMap.innerHTML = `
      <div class="alphabet-row">
        <span class="alphabet-row-label">Original Alphabet</span>
        <div class="alphabet-letters" role="group" aria-label="Original alphabet">
          ${[...originalAlphabet].map((letter, index) => `<button class="alphabet-letter" type="button" data-index="${index}" aria-label="Original letter ${letter}">${letter}</button>`).join("")}
        </div>
      </div>
      <div class="alphabet-row">
        <span class="alphabet-row-label">Shifted Alphabet</span>
        <div class="alphabet-letters" role="group" aria-label="Shifted alphabet">
          ${[...shiftedAlphabet].map((letter, index) => `<button class="alphabet-letter" type="button" data-index="${index}" aria-label="${originalAlphabet[index]} maps to ${letter}">${letter}</button>`).join("")}
        </div>
      </div>
    `;
    cipherDetails.hidden = true;
    return;
  }

  cipherDetails.hidden = false;
  if (state.cipher === "vigenere") {
    const key = vigenereKeyInput.value.trim();
    if (!key || !isValidVigenereKey(key)) {
      cipherDetails.innerHTML = `<h3>${description.title}</h3><p>Enter a valid alphabetic keyword to see the expanded key and step-by-step transformation.</p>`;
      return;
    }

    const result = buildVigenereSteps(sampleMessage, key, state.mode);
    const detailRows = result.steps
      .map((step) => {
        if (step.keyChar === "-") {
          return `<li class="step-item"><strong>${step.original}</strong> remains unchanged; punctuation and spaces are not keyed.</li>`;
        }
        return `<li class="step-item"><strong>${step.original}</strong> + <span class="expanded-key">${step.keyChar}</span> → <strong>${step.transformed}</strong> (${step.detail})</li>`;
      })
      .join("");

    cipherDetails.innerHTML = `
      <h3>${description.title}</h3>
      <p><strong>Expanded key:</strong> <span class="expanded-key">${result.expandedKey}</span></p>
      <ul class="step-list">${detailRows}</ul>
    `;
    return;
  }

  const alphabet = substitutionKeyInput.value.trim() || STANDARD_ALPHABET;
  if (!isValidSubstitutionAlphabet(alphabet)) {
    cipherDetails.innerHTML = `<h3>${description.title}</h3><p>Provide a valid 26-letter substitution alphabet to preview the mapping.</p>`;
    return;
  }

  const display = `A → ${alphabet[0].toUpperCase()} ... Z → ${alphabet[25].toUpperCase()}`;
  cipherDetails.innerHTML = `
    <h3>${description.title}</h3>
    <p><strong>Alphabet map:</strong> ${display}</p>
    <p><strong>Standard alphabet:</strong> ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
    <p><strong>Substitution alphabet:</strong> ${alphabet.toUpperCase()}</p>
  `;
}

// Show the historical context, key use, operation and limitations for the active cipher.
function renderExplanation() {
  const description = cipherDescriptions[state.cipher];
  const listItems = description.explanation.map((item) => `<li>${item}</li>`).join("");
  cipherExplanation.innerHTML = `
    <h3>${description.title}</h3>
    <p>${description.summary}</p>
    <ul>${listItems}</ul>
  `;
}

// Draw measured letter percentages beside the English reference percentages.
function renderFrequencyAnalysis() {
  const text = messageInput.value;
  const distribution = calculateFrequencyDistribution(text);
  const baseline = getEnglishFrequencyBaseline();
  const maxValue = Math.max(...distribution.map((entry) => entry.percentage), ...baseline.map((entry) => entry.percentage), 1);

  const rows = distribution
    .map((entry) => {
      const english = baseline.find((item) => item.letter === entry.letter)?.percentage ?? 0;
      return `
        <div class="frequency-row">
          <span class="frequency-letter">${entry.letter}</span>
          <div class="frequency-bar-wrap">
            <span class="frequency-bar" style="width: ${(entry.percentage / maxValue) * 100}%"></span>
            <span class="frequency-bar baseline" style="width: ${(english / maxValue) * 100}%; opacity: 0.35; left: 0;"></span>
          </div>
          <span class="frequency-value">${entry.percentage.toFixed(1)}%</span>
        </div>
      `;
    })
    .join("");

  frequencyChart.innerHTML = rows;
}

// Populate all 26 Caesar decryptions only while both nested analysis panels are open.
function renderBruteforceCandidates() {
  if (!analysisPanel.open || !bruteforcePanel.open) {
    return;
  }

  const text = messageInput.value;
  const candidates = caesarBruteforce(text || "");
  // map() turns each result into a selectable button; the click callback reads that button's shift.
  bruteForceCandidates.innerHTML = candidates
    .map(
      (candidate) => `
        <button class="bruteforce-item" type="button" data-shift="${candidate.shift}">
          <strong>Shift ${candidate.shift}</strong>
          <small>${candidate.plaintext}</small>
        </button>
      `
    )
    .join("");

bruteForceCandidates.querySelectorAll(".bruteforce-item").forEach((button) => {
  button.addEventListener("click", () => {
    const shift = Number(button.dataset.shift);

    // Keep the ciphertext in Message and let the normal output update decrypt it with this shift.
    caesarShiftInput.value = String(shift);
    caesarShiftValue.textContent = String(shift);

    state.cipher = "caesar";
    state.mode = "decrypt";
    modeSelect.value = "decrypt";

    setActiveCipher("caesar");
  });
});
}

// Display the count summary produced by the separate text-statistics module.
function renderTextStatistics() {
  const stats = getTextStatistics(messageInput.value);
  const cards = [
    ["Characters", stats.characterCount],
    ["Alphabetic", stats.alphabeticCharacterCount],
    ["Words", stats.wordCount],
    ["Unique letters", stats.uniqueLetterCount],
  ];

  textStatistics.innerHTML = cards
    .map(
      ([label, value]) => `
        <div class="stat-card">
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `
    )
    .join("");
}

// Analysis is lazy: frequency and statistics render only when the outer details panel is open.
function renderAnalysis() {
  const isCaesarSelected = state.cipher === "caesar";
  bruteforcePanel.hidden = !isCaesarSelected;
  if (!isCaesarSelected) {
    bruteforcePanel.open = false;
  }

  if (!analysisPanel.open) {
    return;
  }

  renderFrequencyAnalysis();
  renderTextStatistics();
  if (bruteforcePanel.open) {
    renderBruteforceCandidates();
  }
}

// Recalculate the main result from the current message, cipher, mode and key values.
function updateOutput() {
  const text = messageInput.value;
  const method = state.mode;

  try {
    if (state.cipher === "caesar") {
      const shift = Number(caesarShiftInput.value);
      outputText.value = method === "encrypt" ? caesarEncrypt(text, shift) : caesarDecrypt(text, shift);
      return;
    }

    if (state.cipher === "vigenere") {
      const key = vigenereKeyInput.value;
      if (!key || !isValidVigenereKey(key)) {
        outputText.value = "";
        return;
      }
      outputText.value = method === "encrypt" ? vigenereEncrypt(text, key) : vigenereDecrypt(text, key);
      return;
    }

    const alphabet = substitutionKeyInput.value.trim();
    if (!isValidSubstitutionAlphabet(alphabet)) {
      outputText.value = "";
      return;
    }
    outputText.value = method === "encrypt" ? substitutionEncrypt(text, alphabet) : substitutionDecrypt(text, alphabet);
  } catch (error) {
    outputText.value = "";
  }
}

// Central redraw function used after user changes; cipher functions stay separate from the UI.
function renderAll() {
  caesarShiftValue.textContent = caesarShiftInput.value;
  renderSubstitutionPreview();
  validateVigenereKey();
  const subStatus = validateSubstitutionAlphabet();
  if (state.cipher === "substitution") {
    substitutionKeyInput.setCustomValidity(subStatus.valid ? "" : subStatus.message);
  }

  updateOutput();
  renderCipherDetails();
  renderExplanation();
  renderAnalysis();
}

// Change state when the operation selector changes, then refresh output and teaching views.
modeSelect.addEventListener("change", (event) => {
  state.mode = event.target.value;
  renderAll();
});

// The shift slider changes both the cipher result and the displayed Caesar alphabet mapping.
caesarShiftInput.addEventListener("input", (event) => {
  caesarShiftValue.textContent = String(event.target.value);
  renderAll();
});

// Validate the keyword as it is typed, then update the output and expanded-key example.
vigenereKeyInput.addEventListener("input", () => {
  validateVigenereKey();
  renderAll();
});

// Revalidate the custom alphabet and refresh substitution output as the key is edited.
substitutionKeyInput.addEventListener("input", () => {
  renderAll();
});

// Input events keep the output and open analysis views synchronized with the message.
messageInput.addEventListener("input", renderAll);

// Each tab's callback passes its data-cipher value into the common cipher-switch function.
tabs.forEach((tab) => {
  tab.addEventListener("click", () => setActiveCipher(tab.dataset.cipher));
});

// Native <details> toggle events let HTML control expansion while JavaScript fills visible results.
analysisPanel.addEventListener("toggle", renderAnalysis);
bruteforcePanel.addEventListener("toggle", renderBruteforceCandidates);

// Pointer and keyboard focus both highlight corresponding Caesar letters.
caesarAlphabetMap.addEventListener("pointerover", (event) => {
  const letter = event.target.closest(".alphabet-letter");
  if (letter) {
    highlightAlphabetPair(letter.dataset.index);
  }
});

caesarAlphabetMap.addEventListener("pointerout", (event) => {
  const leavingLetter = event.target.closest(".alphabet-letter");
  const enteringLetter = event.relatedTarget?.closest?.(".alphabet-letter");
  if (leavingLetter && !enteringLetter) {
    highlightAlphabetPair(caesarAlphabetMap.dataset.selectedIndex);
  }
});

caesarAlphabetMap.addEventListener("focusin", (event) => {
  const letter = event.target.closest(".alphabet-letter");
  if (letter) {
    highlightAlphabetPair(letter.dataset.index);
  }
});

caesarAlphabetMap.addEventListener("focusout", () => {
  highlightAlphabetPair(caesarAlphabetMap.dataset.selectedIndex);
});

caesarAlphabetMap.addEventListener("click", (event) => {
  const letter = event.target.closest(".alphabet-letter");
  if (!letter) {
    return;
  }

  const selectedIndex = caesarAlphabetMap.dataset.selectedIndex;
  caesarAlphabetMap.dataset.selectedIndex = selectedIndex === letter.dataset.index
    ? ""
    : letter.dataset.index;
  highlightAlphabetPair(caesarAlphabetMap.dataset.selectedIndex);
});

// Copy the result when clipboard access is available; selecting the output is the local fallback.
document.getElementById("copy-output").addEventListener("click", async () => {
  const text = outputText.value;
  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    document.getElementById("copy-output").textContent = "Copied";
    setTimeout(() => {
      document.getElementById("copy-output").textContent = "Copy output";
    }, 900);
  } catch (error) {
    outputText.select();
  }
});

// Clearing the message uses the normal render path so output and visible analysis also clear.
document.getElementById("clear-input").addEventListener("click", () => {
  messageInput.value = "";
  renderAll();
});

// Swap the two text values, then recalculate output from the new input.
document.getElementById("swap-input-output").addEventListener("click", () => {
  const previous = messageInput.value;
  messageInput.value = outputText.value;
  outputText.value = previous;
  renderAll();
});

// The random-key button uses the cipher module's validated alphabet shuffle.
document.getElementById("generate-substitution").addEventListener("click", () => {
  substitutionKeyInput.value = generateRandomSubstitutionAlphabet();
  renderAll();
});

// Reset the custom cipher key to the standard A–Z mapping.
document.getElementById("reset-substitution").addEventListener("click", () => {
  substitutionKeyInput.value = STANDARD_ALPHABET.toUpperCase();
  renderAll();
});

// Draw the initial page once all controls and event handlers are ready.
renderAll();

// Toggle the matching alphabet pair for hover, focus, or click selection.
function highlightAlphabetPair(index) {
  caesarAlphabetMap.querySelectorAll(".alphabet-letter").forEach((letter) => {
    letter.classList.toggle("is-highlighted", index !== undefined && letter.dataset.index === index);
  });
}
