/**
 * AI Personal Universe Generator — text-to-visual-world pipeline.
 * Parses natural language, matches concept dictionary, merges palettes and motion.
 * Export: generateUniverseFromText(text) → standard palette config for card engine.
 */

import { CONCEPT_DICTIONARY } from './universe-concepts.js';

const MOTIONS = ['rise', 'fall', 'wave', 'swing', 'float', 'drift', 'spiral'];
const SHAPES = ['heart', 'flower', 'leaf', 'music', 'star', 'crystal', 'ember', 'bubble', 'snowflake', 'confetti', 'diamond', 'raindrop'];

/** Hex #RRGGBB → { r, g, b } */
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Hex → "r,g,b" for blob usage */
function hexToBlob(hex) {
  const { r, g, b } = hexToRgb(hex);
  return `${r},${g},${b}`;
}

/** Luminance (0–255) for ordering dark/light */
function luminance(rgb) {
  const { r, g, b } = typeof rgb === 'string' ? hexToRgb(rgb) : rgb;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** Squared distance between two hex colors (for dedup) */
function colorDistanceSq(hexA, hexB) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
}

/** Tokenize input: split on spaces, commas, "and" (case-insensitive). */
export function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  const normalized = text
    .replace(/,/g, ' ')
    .replace(/\band\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized ? normalized.split(' ').filter(Boolean) : [];
}

/** For each token, check all concept keyword arrays; partial match OK, case-insensitive. */
export function matchConcepts(text, dictionary = CONCEPT_DICTIONARY) {
  const tokens = tokenize(text);
  const matches = [];
  const seen = new Set();
  for (const concept of dictionary) {
    if (concept.keywords[0] === '__default__') continue;
    for (const kw of concept.keywords) {
      const kwLower = kw.toLowerCase();
      for (const token of tokens) {
        const t = token.toLowerCase();
        if (kwLower.includes(t) || t.includes(kwLower)) {
          if (!seen.has(concept)) {
            seen.add(concept);
            matches.push(concept);
          }
          break;
        }
      }
    }
  }
  return matches;
}

/** Merge palettes: deduplicate similar colors (within threshold), keep up to 6. */
function mergePalettes(concepts, randomize = false) {
  const allHex = [];
  for (const c of concepts) {
    for (const hex of c.palette) allHex.push(hex);
  }
  if (allHex.length === 0) return [];
  const SIMILAR_THRESHOLD = 40 * 40 * 3; // squared distance
  const out = [];
  for (const hex of allHex) {
    const tooSimilar = out.some((existing) => colorDistanceSq(hex, existing) < SIMILAR_THRESHOLD);
    if (!tooSimilar) out.push(hex);
    if (out.length >= 6) break;
  }
  if (randomize && out.length > 1) {
    const shuffled = [...out].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
  }
  return out.length ? out : [allHex[0]];
}

/** Select motion by frequency among matches; tie-break: first in MOTIONS. */
function selectMotion(concepts) {
  const counts = {};
  for (const c of concepts) {
    const m = c.motion || 'float';
    counts[m] = (counts[m] || 0) + 1;
  }
  let best = 'float', maxCount = 0;
  for (const [m, n] of Object.entries(counts)) {
    if (n > maxCount) { maxCount = n; best = m; }
  }
  return MOTIONS.includes(best) ? best : 'float';
}

/** Select particleShape from first strong match (first concept). */
function selectShape(concepts) {
  const first = concepts[0];
  const shape = first?.particleShape || 'star';
  return SHAPES.includes(shape) ? shape : 'star';
}

/** Dominant mood: most frequent among concepts; default cool. */
function selectMood(concepts) {
  const counts = { warm: 0, cool: 0, neutral: 0 };
  for (const c of concepts) {
    const m = c.mood || 'neutral';
    counts[m] = (counts[m] || 0) + 1;
  }
  if (counts.warm >= counts.cool && counts.warm >= counts.neutral) return 'warm';
  if (counts.cool >= counts.neutral) return 'cool';
  return 'neutral';
}

/** Average density, clamped 20–50. */
function selectDensity(concepts) {
  if (!concepts.length) return 35;
  const sum = concepts.reduce((a, c) => a + (c.density || 35), 0);
  return Math.round(Math.max(20, Math.min(50, sum / concepts.length)));
}

/** Background: darkest hex if mood cool, lightest if warm; else middle. */
function pickBackground(mergedHex, mood) {
  if (!mergedHex.length) return '#0A0A18';
  const sorted = [...mergedHex].sort((a, b) => luminance(a) - luminance(b));
  if (mood === 'cool') return sorted[0];
  if (mood === 'warm') return sorted[sorted.length - 1];
  return sorted[Math.floor(sorted.length / 2)];
}

/** Slight randomization: nudge RGB of palette colors. */
function randomizePalette(hexArray, amount = 12) {
  return hexArray.map((hex) => {
    const { r, g, b } = hexToRgb(hex);
    const nudge = () => Math.round((Math.random() - 0.5) * amount * 2);
    return '#' + [r, g, b]
      .map((v) => Math.max(0, Math.min(255, v + nudge())).toString(16).padStart(2, '0'))
      .join('');
  });
}

/**
 * Generate universe config from natural language.
 * @param {string} text - User description (e.g. "She loves jazz, the ocean, and sunflowers at sunset")
 * @param {{ randomize?: boolean }} options - Set randomize: true for "Try again" (slight color variation)
 * @returns {object} Standard palette config for card engine:
 *   { bg, blobs, light?, motion, particleShape, density, palette (hex[]) }
 */
export function generateUniverseFromText(text, options = {}) {
  const { randomize = false } = options;
  const concepts = matchConcepts(text);

  let mergedHex;
  let mood;
  let motion;
  let particleShape;
  let density;

  if (concepts.length === 0) {
    const defaultConcept = CONCEPT_DICTIONARY.find((c) => c.keywords[0] === '__default__') || CONCEPT_DICTIONARY[CONCEPT_DICTIONARY.length - 1];
    mergedHex = [...(defaultConcept.palette || ['#0A0A18', '#181830', '#6060A0'])];
    mood = defaultConcept.mood || 'cool';
    motion = defaultConcept.motion || 'drift';
    particleShape = defaultConcept.particleShape || 'star';
    density = defaultConcept.density ?? 35;
  } else {
    mergedHex = mergePalettes(concepts, randomize);
    mood = selectMood(concepts);
    motion = selectMotion(concepts);
    particleShape = selectShape(concepts);
    density = selectDensity(concepts);
  }

  if (randomize && mergedHex.length) {
    mergedHex = randomizePalette(mergedHex);
  }

  const bg = pickBackground(mergedHex, mood);
  const blobs = mergedHex.slice(0, 4).map(hexToBlob);
  const light = luminance(hexToRgb(bg)) > 180;

  return {
    bg,
    blobs,
    light,
    motion,
    particleShape,
    density,
    palette: mergedHex,
  };
}
