# Cipher Lab

## Overview

Cipher Lab is an interactive educational workspace for exploring classical cryptography and basic cryptanalysis. Choose a cipher, enter a message and key, and see the result alongside visual demonstrations and text analysis.

## Features

- **Caesar cipher:** Encrypt or decrypt with a shift from 0 to 25, inspect the alphabet mapping, and compare all 26 possible decryptions.
- **Vigenère cipher:** Encrypt or decrypt with an alphabetic keyword and view how the repeated key aligns with the message.
- **Monoalphabetic substitution:** Encrypt or decrypt with a custom 26-letter alphabet. The interface validates keys and can generate or reset an alphabet.
- **Frequency analysis:** Compare the input's letter-frequency distribution with approximate English letter frequencies.
- **Text statistics:** View character, alphabetic character, word, and unique-letter counts for the input.
- **Educational explanations:** Read cipher-specific explanations and inspect step-by-step examples.
- **Convenience controls:** Copy the output, clear the message, or swap the input and output.

## Technologies Used

- HTML for the page structure
- CSS for styling and responsive layout
- JavaScript ES modules for the interface, ciphers, and analysis
- Node.js built-in test runner (`node:test`) and assertions (`node:assert/strict`) for automated tests

The project has no application framework or external runtime dependencies.

## Project Structure

```text
.
├── index.html                 # App interface and controls
├── styles.css                 # Layout, visual styling, and responsive rules
├── js/
│   ├── app.js                 # UI state, event handling, and rendering
│   ├── caesar.js              # Caesar cipher and brute-force candidates
│   ├── vigenere.js            # Vigenère cipher and key demonstrations
│   ├── substitution.js        # Substitution alphabet validation and transforms
│   ├── frequency-analysis.js  # Letter counts and English frequency baseline
│   └── text-statistics.js     # Message statistics
└── tests/
    └── cipher-lab.test.mjs    # Tests for cipher and analysis modules
```

## Getting Started

Clone the repository and enter its folder:

```sh
git clone https://github.com/lizalfathim-eng/cipher-lab.git
cd cipher-lab
```

Serve the project from its root directory. Because the app loads JavaScript ES modules, opening `index.html` directly with a `file://` URL may be blocked by browser security restrictions. A local HTTP server is recommended; Live Server is optional, not required.

For example, if Python is installed:

```sh
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in a browser. Stop the server with `Ctrl+C`.

## How It Works

- **Caesar** moves each English letter by a fixed number of alphabet positions. Encryption adds the shift, and decryption subtracts it; positions wrap around at the end of the alphabet.
- **Vigenère** uses each letter of a repeating keyword as a different shift. Decryption subtracts those shifts in the same order. Spaces and punctuation are preserved and do not consume key letters.
- **Monoalphabetic substitution** replaces each letter using a one-to-one mapping defined by a permutation of the alphabet. Decryption uses the inverse mapping.

The analysis tools count English letters in the input and compare their proportions with a reference frequency table. These observations can help illustrate weaknesses in classical ciphers, but do not automatically decrypt messages.

## Testing

The tests use Node.js's built-in test runner and do not require a separate test framework or package installation. From the project root, run:

```sh
node --test tests/cipher-lab.test.mjs
```

The tests cover cipher encryption and decryption, key validation, Caesar shifts, frequency distribution, and text statistics.

## Limitations

These classical ciphers are demonstrations for learning and experimentation. They do not provide modern security and must not be used to protect passwords, personal information, or other sensitive data.

## Future Improvements

Possible future extensions include additional classical ciphers, interactive browser-level tests, and options to export analysis results. These are ideas for future work and are not currently implemented.
