
import { GoogleGenAI, Type } from "@google/genai";
import { GlossaryDefinition } from "../types";

// --- Configuration ---
const MODELS = {
  FAST: 'gemini-3-flash-preview', 
  PRO: 'gemini-3-pro-preview',     
  IMAGE: 'gemini-2.5-flash-image',
  TTS: 'gemini-2.5-flash-preview-tts'
} as const;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Reusable Schema Definitions ---
const PLANET_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    degree: { type: Type.NUMBER },
    sign: { type: Type.STRING },
    isRetrograde: { type: Type.BOOLEAN }
  },
  required: ["name", "degree", "sign"]
} as const;

const ASPECT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    p1: { type: Type.STRING },
    p2: { type: Type.STRING },
    type: { type: Type.STRING },
    orb: { type: Type.NUMBER }
  },
  required: ["p1", "p2", "type", "orb"]
} as const;

const PLANETS_ARRAY_SCHEMA = {
  type: Type.ARRAY,
  items: PLANET_SCHEMA
} as const;

const ASPECTS_ARRAY_SCHEMA = {
  type: Type.ARRAY,
  items: ASPECT_SCHEMA
} as const;

const CHART_DATA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ascendant: { type: Type.NUMBER },
    midheaven: { type: Type.NUMBER },
    planets: PLANETS_ARRAY_SCHEMA,
    aspects: ASPECTS_ARRAY_SCHEMA
  },
  required: ["ascendant", "planets", "aspects"]
} as const;

// --- Helper: Generic JSON Generator ---
async function generateJson<T>(model: string, prompt: string, schema: any): Promise<T | null> {
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error(`Gemini Error (${model}):`, error);
    return null;
  }
}

// --- Numerology Helpers (Local Calculation) ---
const LETTER_MAP: Record<string, number> = {
  'a': 1, 'j': 1, 's': 1,
  'b': 2, 'k': 2, 't': 2,
  'c': 3, 'l': 3, 'u': 3,
  'd': 4, 'm': 4, 'v': 4,
  'e': 5, 'n': 5, 'w': 5,
  'f': 6, 'o': 6, 'x': 6,
  'g': 7, 'p': 7, 'y': 7,
  'h': 8, 'q': 8, 'z': 8,
  'i': 9, 'r': 9
};

// Optimized: Iterative instead of recursive
function reduceNumber(num: number): number {
  let current = num;
  while (current >= 10 && current !== 11 && current !== 22 && current !== 33) {
    let sum = 0;
    while (current > 0) {
      sum += current % 10;
      current = Math.floor(current / 10);
    }
    current = sum;
  }
  return current;
}

// Optimized: Single pass through name string
function calculateNumerology(name: string, birthDate: string) {
  // Life Path
  let dateSum = 0;
  for (let i = 0; i < birthDate.length; i++) {
    const digit = birthDate.charCodeAt(i) - 48; // '0' = 48
    if (digit >= 0 && digit <= 9) {
      dateSum += digit;
    }
  }
  const lifePath = reduceNumber(dateSum);

  // Destiny (Expression) and Soul Urge in single pass
  const cleanName = name.toLowerCase();
  let destinySum = 0;
  let soulSum = 0;
  const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
  
  for (let i = 0; i < cleanName.length; i++) {
    const char = cleanName[i];
    if (char >= 'a' && char <= 'z') {
      const value = LETTER_MAP[char] || 0;
      destinySum += value;
      if (VOWELS.has(char)) {
        soulSum += value;
      }
    }
  }

  return {
    lifePath,
    destinyNumber: reduceNumber(destinySum),
    soulUrge: reduceNumber(soulSum)
  };
}

// --- Sigil Helper ---
// Optimized: Use Set for O(1) vowel lookup
const VOWELS_UPPER = new Set(['A', 'E', 'I', 'O', 'U']);

function distillIntention(intention: string): string {
  const clean = intention.toUpperCase().replace(/[^A-Z]/g, '');
  const uniqueConsonants = new Set<string>();
  
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (!VOWELS_UPPER.has(char)) {
      uniqueConsonants.add(char);
    }
  }
  return Array.from(uniqueConsonants).join('');
}

// --- Services ---

export const getHoraryAnalysis = async (question: string, lat: number, lng: number, timestamp: string) => {
  const prompt = `You are a precision Swiss Ephemeris Engine and Master Horary Astrologer. Cast a high-fidelity chart for the EXACT MOMENT: ${timestamp} at Latitude ${lat}, Longitude ${lng}.

Technical Requirements:
1. Calculate planetary degrees (0-359.99) with decimal precision.
2. Identify the Ascendant and Midheaven (MC).
3. Compute all major aspects (Conjunction, Sextile, Square, Trine, Opposition) with exact orbs.
4. Analyze significators for: "${question}".

Output in strictly validated JSON.`;

  return generateJson(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      chartData: CHART_DATA_SCHEMA,
      judgment: { type: Type.STRING },
      technicalNotes: { type: Type.STRING },
      outcome: { type: Type.STRING }
    },
    required: ["chartData", "judgment", "technicalNotes", "outcome"]
  });
};

export const getElectionalAnalysis = async (question: string, lat: number, lng: number) => {
  const prompt = `You are a high-precision Electional Astrologer and Ephemeris Engine. Scan the next 30 days from now (${new Date().toISOString()}) to identify the OPTIMAL temporal node for: "${question}". Location: Lat ${lat}, Lng ${lng}. Calculate exact positions and major aspects for the selected moment.`;

  return generateJson(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      selectedDate: { type: Type.STRING },
      chartData: {
        type: Type.OBJECT,
        properties: {
          ascendant: { type: Type.NUMBER },
          planets: PLANETS_ARRAY_SCHEMA,
          aspects: ASPECTS_ARRAY_SCHEMA
        },
        required: ["ascendant", "planets", "aspects"]
      },
      judgment: { type: Type.STRING },
      technicalNotes: { type: Type.STRING },
      outcome: { type: Type.STRING }
    },
    required: ["selectedDate", "chartData", "judgment", "technicalNotes", "outcome"]
  });
};

export const getNumerologyAnalysis = async (name: string, birthday: string) => {
  // 1. Calculate locally to ensure arithmetic accuracy
  const { lifePath, destinyNumber, soulUrge } = calculateNumerology(name, birthday);

  // 2. Ask AI for interpretation based on these calculated numbers
  const prompt = `Provide an esoteric numerological interpretation for:
Subject: ${name}
Life Path: ${lifePath}
Destiny Number: ${destinyNumber}
Soul Urge: ${soulUrge}

Provide a 'meaning' (synthesis of these numbers) and 'esotericInsight' (deeper spiritual implication).`;

  const interpretation = await generateJson<{ meaning: string; esotericInsight: string }>(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      meaning: { type: Type.STRING },
      esotericInsight: { type: Type.STRING }
    },
    required: ["meaning", "esotericInsight"]
  });

  return {
    lifePath,
    destinyNumber,
    soulUrge,
    meaning: interpretation?.meaning || "The numbers are silent.",
    esotericInsight: interpretation?.esotericInsight || "Vibrations unclear.",
    systemComparison: "Pythagorean (Calculated)"
  };
};

export const generateSigil = async (intention: string, feeling: string) => {
  try {
    const distilled = distillIntention(intention);
    // Fallback if distilled is empty
    const seed = distilled.length > 0 ? distilled : intention.toUpperCase().replace(/[^A-Z]/g, '');

    const prompt = `Create a raw, authentic chaos magic sigil based on the following letter forms: "${seed}".
Method: Deconstruct the letters and recombine their strokes into a single, fused, abstract glyph.
Style: Minimalist black ink on white paper. Hand-drawn aesthetic. High contrast.
No glowing effects. No background details/patterns. No text in the image. 
The result should be a simple, powerful, esoteric symbol.`;
    
    const response = await ai.models.generateContent({
      model: MODELS.IMAGE,
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    
    // Check for inline data (Base64)
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Sigil Generation Error:", error);
    return null;
  }
};

export const getQuoteWall = async (theme: string) => {
  const prompt = `Generate 6 unique, cryptic, and powerful esoteric quotes based on the theme: "${theme}". Brutalist, academic, and mystical tone.`;
  
  const result = await generateJson<string[]>(MODELS.FAST, prompt, {
    type: Type.ARRAY,
    items: { type: Type.STRING }
  });

  return result || ["The grid is silent.", "Silence is the code.", "The void answers only in frequency."];
};

export const getWordDefinition = async (word: string) => {
  const prompt = `Explain the following esoteric, technical, or occult term in the context of high magic and philosophy: "${word}".`;
  
  return generateJson<GlossaryDefinition>(MODELS.FAST, prompt, {
    type: Type.OBJECT,
    properties: {
      word: { type: Type.STRING },
      definition: { type: Type.STRING },
      etymology: { type: Type.STRING }
    },
    required: ["word", "definition"]
  });
};

export const getBaziAnalysis = async (date: string, time: string) => {
  const prompt = `Calculate the Bazi (Four Pillars of Destiny) chart for: Date ${date}, Time ${time}. Ensure each pillar has a personalized 'personalExplanation' that describes its deep impact on the user's archetypal path.`;

  return generateJson(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      pillars: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            stem: { type: Type.STRING },
            branch: { type: Type.STRING },
            tenGod: { type: Type.STRING },
            hiddenStems: { type: Type.ARRAY, items: { type: Type.STRING } },
            personalExplanation: { type: Type.STRING }
          },
          required: ["type", "stem", "branch", "tenGod", "hiddenStems", "personalExplanation"]
        }
      },
      dayMaster: { type: Type.STRING },
      densityProfile: { type: Type.STRING },
      tenGodsAnalysis: { 
        type: Type.ARRAY, 
        items: { 
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            vector: { type: Type.STRING },
            implication: { type: Type.STRING }
          },
          required: ["name", "vector", "implication"]
        }
      },
      thermodynamicLogic: { type: Type.STRING }
    },
    required: ["pillars", "dayMaster", "densityProfile", "tenGodsAnalysis", "thermodynamicLogic"]
  });
};

export const getBiologicalDepreciation = async (metrics: { age: number; telomereMaintenance: number; systemicLoad: number }) => {
  const prompt = `Actuarial analysis (Gompertz-Makeham) for Subject: Age ${metrics.age}, Telomere Maintenance Score ${metrics.telomereMaintenance}/10, Systemic Load Score ${metrics.systemicLoad}/10.

Generate a response for a layperson.
1. 'obsolescenceDate': The projected end date in MM/DD/YYYY format.
2. 'accuracyProbability': A percentage confidence.
3. 'actuarialReport': A simple, easy-to-understand explanation of why this date was projected based on their lifestyle (maintenance and load). Avoid complex jargon; focus on the impact of their choices.
4. 'depreciationMetrics': A short, punchy summary of the body's condition (e.g. "Moderate Wear", "High Efficiency").

IMPORTANT: Return 'obsolescenceDate' strictly in MM/DD/YYYY format.`;
  
  return generateJson(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      obsolescenceDate: { type: Type.STRING },
      accuracyProbability: { type: Type.NUMBER },
      actuarialReport: { type: Type.STRING },
      depreciationMetrics: { type: Type.STRING }
    },
    required: ["obsolescenceDate", "accuracyProbability", "actuarialReport", "depreciationMetrics"]
  });
};

export const getFlyingStarAnalysis = async (period: number, facingDegree: number) => {
  const prompt = `Perform a Xuan Kong Flying Star (Xing Kong) spatial mapping for Construction Period ${period} and Facing Direction ${facingDegree} degrees.`;

  return generateJson(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      palaces: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            direction: { type: Type.STRING },
            baseStar: { type: Type.NUMBER },
            mountainStar: { type: Type.NUMBER },
            waterStar: { type: Type.NUMBER },
            technicalStatus: { type: Type.STRING }
          },
          required: ["direction", "baseStar", "mountainStar", "waterStar", "technicalStatus"]
        }
      },
      energyFlowSummary: { type: Type.STRING },
      spatialAdjustments: { type: Type.ARRAY, items: { type: Type.STRING } },
      thermodynamicLogic: { type: Type.STRING }
    },
    required: ["palaces", "energyFlowSummary", "spatialAdjustments", "thermodynamicLogic"]
  });
};

export const getPieDeconstruction = async (word: string) => {
  const prompt = `Perform a PIE (Proto-Indo-European) etymological deconstruction for: "${word}".`;

  return generateJson(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      pieRoot: { type: Type.STRING },
      rootMeaning: { type: Type.STRING },
      semanticTrace: { type: Type.ARRAY, items: { type: Type.STRING } },
      modernConcept: { type: Type.STRING },
      esotericImplication: { type: Type.STRING }
    },
    required: ["pieRoot", "rootMeaning", "semanticTrace", "modernConcept", "esotericImplication"]
  });
};

export const getColorPalette = async (input: string, mode: 'date' | 'vibe') => {
  const prompt = `Analyze the 'Elemental Density' and 'Vibrational Spectrum' for: "${input}" (${mode} mode). Generate an expansive 12-color design matrix. Organize the palette into 3 distinct layers: 'The Root' (Foundational essence), 'The Aether' (Shadow and hidden frequencies), and 'The Flare' (Aspirational and spiritual zenith). Each layer must contain 4 specific hex colors.`;

  return generateJson(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      analysis: { type: Type.STRING },
      deficiency: { type: Type.STRING },
      colors: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            hex: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            layer: { type: Type.STRING, description: "Layer type: 'Root', 'Aether', or 'Flare'" }
          },
          required: ["name", "hex", "reasoning", "layer"]
        }
      },
      technicalSynthesis: { type: Type.STRING }
    },
    required: ["analysis", "deficiency", "colors", "technicalSynthesis"]
  });
};

export const getTarotReading = async (cards: { name: string; isReversed: boolean }[], question: string) => {
  const cardDescriptions = cards.map(c => `${c.name} (${c.isReversed ? 'Reversed' : 'Upright'})`).join(', ');
  const prompt = `Perform a professional tarot reading for: "${question}". Cards: ${cardDescriptions}.`;
  
  const result = await generateJson<{ interpretation: string; guidance: string }>(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      interpretation: { type: Type.STRING },
      guidance: { type: Type.STRING }
    },
    required: ["interpretation", "guidance"]
  });

  return result || { interpretation: "Archetypes obscured.", guidance: "Seek clarity later." };
};

export const generateCosmicMadLib = async (inputs: { noun: string; verb: string; adjective: string; object: string; place: string }) => {
  const prompt = `Create a 'Cosmic Mad-Lib' ritual workshop with these: Noun: ${inputs.noun}, Verb: ${inputs.verb}, Adjective: ${inputs.adjective}, Object: ${inputs.object}, Place: ${inputs.place}.`;

  return generateJson(MODELS.FAST, prompt, {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      steps: { type: Type.ARRAY, items: { type: Type.STRING } },
      revelation: { type: Type.STRING }
    },
    required: ["title", "steps", "revelation"]
  });
};

export const getFriendshipMatrix = async (subject1: string, subject2: string) => {
  const prompt = `Vibrational synastry for Subject Alpha: "${subject1}" and Subject Beta: "${subject2}".`;

  return generateJson(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      compatibilityScore: { type: Type.NUMBER },
      vibrationalMatch: { type: Type.STRING },
      analysis: { type: Type.STRING }
    },
    required: ["compatibilityScore", "vibrationalMatch", "analysis"]
  });
};

export const generateSpeech = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: MODELS.TTS,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Generate Speech Error:", error);
    return null;
  }
};
