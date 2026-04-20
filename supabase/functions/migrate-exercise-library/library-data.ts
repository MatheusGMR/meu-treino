// Auto-generated from Biblioteca_Exercicios_MeuTreino_v2.docx
// Read at runtime from sibling _library.json

import libraryJson from "./_library.json" with { type: "json" };

export interface LibraryExercise {
  external_id: string;
  name: string;
  movement: string;
  equipment: string;
  variation: string;
  muscle_group: string;
  safety_label: string;
  difficulty_code: string;
  block_section: string;
}

export interface LibraryRestriction {
  external_id: string;
  name: string;
  limitation: string;
  restriction: string;
  substitution_id: string | null;
  substitution_full: string;
}

export const LIBRARY: {
  exercises: LibraryExercise[];
  restrictions: LibraryRestriction[];
} = libraryJson as any;

// ===== Mapping helpers =====
export function blockFromExternalId(id: string): string {
  return id.split("-")[0];
}

export function equipmentCodeFromExternalId(id: string): string {
  return id.split("-")[1];
}

export function safetyFromExternalId(id: string): string {
  // S1..S5
  const part = id.split("-")[2];
  return part; // already "S1".."S5"
}

export function difficultyFromExternalId(id: string): string {
  return id.split("-")[3];
}

// Map block code -> exercise_group enum bucket (best-effort default)
// We do NOT modify exercise_group on existing matched exercises; only used for inserts.
const GROUP_BY_MUSCLE: Record<string, string> = {
  // primary keywords -> existing exercise_group enum value
  "peito": "Peito",
  "costas": "Costas",
  "ombro": "Ombros",
  "bíceps": "Bíceps",
  "biceps": "Bíceps",
  "tríceps": "Tríceps",
  "triceps": "Tríceps",
  "glúteo": "Glúteos",
  "gluteo": "Glúteos",
  "panturrilha": "Panturrilha",
  "quadríceps": "Quadríceps",
  "quadriceps": "Quadríceps",
  "posterior": "Posterior",
  "isquiotibiais": "Posterior",
  "lombar": "Lombar",
  "abdômen": "Abdômen",
  "abdomen": "Abdômen",
  "core": "Abdômen",
  "perna": "Pernas",
  "quadril": "Pernas",
  "joelho": "Pernas",
  "tornozelo": "Pernas",
  "coluna": "Tronco",
};

export function inferExerciseGroup(muscleGroup: string, block: string): string {
  const lower = muscleGroup.toLowerCase();
  for (const key of Object.keys(GROUP_BY_MUSCLE)) {
    if (lower.includes(key)) return GROUP_BY_MUSCLE[key];
  }
  if (block === "CARD") return "Cardio" in {} ? "Cardio" : "Outro";
  return "Outro";
}

export function inferExerciseType(block: string): string {
  switch (block) {
    case "MOB": return "Mobilidade";
    case "ALONG": return "Alongamento";
    case "CARD": return "Cardio";
    default: return "Musculação";
  }
}
