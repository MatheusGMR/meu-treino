// Taxonomia compartilhada para o wizard de cadastro de exercício do Protocolo JMP.
// Mantém alinhamento com os enums do banco: exercise_block_enum, equipment_code_enum,
// safety_level_enum.

export type BlockCode = "MOB" | "FORT" | "MS" | "MI" | "CARD" | "ALONG";
export type EquipCode = "PC" | "ELAS" | "MAC" | "DIV" | "CONV" | "CAB" | "BAR" | "HAL";
export type SafetyCode = "S1" | "S2" | "S3" | "S4" | "S5";
export type LevelCode = "BI" | "BII" | "BIII" | "IN1" | "IN2" | "IN3";

export const BLOCOS: { cod: BlockCode; nome: string; emoji: string }[] = [
  { cod: "MOB", nome: "Mobilidade", emoji: "🔵" },
  { cod: "FORT", nome: "Fortalecimento", emoji: "🟢" },
  { cod: "MS", nome: "Resistido MMSS", emoji: "🔷" },
  { cod: "MI", nome: "Resistido MMII", emoji: "🔷" },
  { cod: "CARD", nome: "Cardio", emoji: "🟠" },
  { cod: "ALONG", nome: "Alongamento", emoji: "🩷" },
];

export const EQUIP_MAP: Record<BlockCode, [EquipCode, string][]> = {
  MOB: [["PC", "Peso Corporal"], ["ELAS", "Elástico"], ["BAR", "Bastão"]],
  FORT: [["PC", "Peso Corporal"], ["ELAS", "Elástico"]],
  MS: [
    ["MAC", "Máquina"],
    ["DIV", "Articulado DIV"],
    ["CONV", "Articulado CONV"],
    ["CAB", "Cabo / Polia"],
    ["BAR", "Barra Livre"],
    ["HAL", "Halter"],
    ["PC", "Peso Corporal"],
  ],
  MI: [
    ["MAC", "Máquina"],
    ["DIV", "Articulado DIV"],
    ["CONV", "Articulado CONV"],
    ["CAB", "Cabo / Polia"],
    ["BAR", "Barra Livre"],
    ["HAL", "Halter"],
    ["PC", "Peso Corporal"],
  ],
  CARD: [["MAC", "Equipamento Aeróbio"]],
  ALONG: [["PC", "Peso Corporal"], ["ELAS", "Elástico"]],
};

export const SEG_MAP: Record<EquipCode, { seg: SafetyCode; nome: string; desc: string }> = {
  MAC: {
    seg: "S1",
    nome: "Muito Seguro",
    desc: "Guiado + braço controlado — sem instabilidade glenoumeral",
  },
  DIV: {
    seg: "S2",
    nome: "Seguro",
    desc: "Articulado com braço divergindo — vetor controlado",
  },
  CONV: {
    seg: "S2",
    nome: "Seguro",
    desc: "Articulado com braço convergindo — vetor encurta no final",
  },
  PC: {
    seg: "S1",
    nome: "Muito Seguro",
    desc: "Peso corporal — cadeia fechada ou mobilidade controlada",
  },
  ELAS: {
    seg: "S1",
    nome: "Muito Seguro",
    desc: "Resistência progressiva sem carga axial livre",
  },
  BAR: {
    seg: "S3",
    nome: "Moderado",
    desc: "Guia a barra mas não o quadril — exige padrão motor ativo",
  },
  CAB: {
    seg: "S4",
    nome: "Baixo",
    desc: "Sem guia + resistência contínua no arco livre",
  },
  HAL: {
    seg: "S5",
    nome: "Baixo-",
    desc: "Totalmente livre + amplitude irrestrita — máxima demanda",
  },
};

export const NIVEIS: { cod: LevelCode; nome: string; desc: string }[] = [
  { cod: "BI", nome: "Básico I", desc: "Entrada / proteção máxima" },
  { cod: "BII", nome: "Básico II", desc: "Progressão controlada" },
  { cod: "BIII", nome: "Básico III", desc: "Domínio sólido necessário" },
  { cod: "IN1", nome: "Intermediário 1", desc: "Liberado pelo treinador" },
  { cod: "IN2", nome: "Intermediário 2", desc: "Liberado pelo treinador" },
  { cod: "IN3", nome: "Intermediário 3", desc: "Liberado pelo treinador" },
];

export const VETORES: { grupo: string; opts: [string, string][] }[] = [
  {
    grupo: "Padrões MMSS",
    opts: [
      ["EMP-F", "EMP-F — Empurrar para frente (ex: Supino)"],
      ["EMP-I", "EMP-I — Empurrar inclinado (ex: Supino inclinado)"],
      ["EMP-C", "EMP-C — Empurrar para cima / overhead"],
      ["EMP-B", "EMP-B — Empurrar para baixo (ex: Paralelas)"],
      ["REM", "REM — Remar / puxar para si"],
      ["PUX-C", "PUX-C — Puxar de cima (ex: Puxada)"],
      ["LEV", "LEV — Levantar / dobradiça de quadril"],
    ],
  },
  {
    grupo: "Padrões MMII",
    opts: [
      ["EC-JOE", "EC-JOE — Empurrar o chão / joelho dominante"],
      ["EC-QUA", "EC-QUA — Empurrar o chão / quadril dominante"],
    ],
  },
  {
    grupo: "Capacidades Articulares",
    opts: [
      ["CA-JOE-E", "CA-JOE-E — Esticar a perna (Cadeira Extensora)"],
      ["CA-JOE-D", "CA-JOE-D — Dobrar a perna (Cadeira Flexora)"],
      ["CA-QUA-E", "CA-QUA-E — Esticar o quadril"],
      ["CA-QUA-AB", "CA-QUA-AB — Abrir as pernas (abdução)"],
      ["CA-QUA-AD", "CA-QUA-AD — Fechar as pernas (adução)"],
      ["CA-COT-D", "CA-COT-D — Dobrar o braço (Rosca)"],
      ["CA-COT-E", "CA-COT-E — Esticar o braço (Tríceps)"],
      ["CA-TOR", "CA-TOR — Subir na ponta do pé (panturrilha)"],
    ],
  },
  {
    grupo: "Mobilidade",
    opts: [
      ["MOB-QUA", "MOB-QUA — Mobilidade de quadril"],
      ["MOB-LOM", "MOB-LOM — Mobilidade lombar"],
      ["MOB-OML", "MOB-OML — Mobilidade de ombro"],
      ["MOB-TOR", "MOB-TOR — Mobilidade de tornozelo"],
    ],
  },
  {
    grupo: "Fortalecimento",
    opts: [
      ["FORT-CE", "FORT-CE — Core / estabilização"],
      ["FORT-CA", "FORT-CA — Capacidade articular"],
      ["FORT-OML", "FORT-OML — Ombro / manguito"],
    ],
  },
  {
    grupo: "Alongamento",
    opts: [
      ["ALONG-POST", "ALONG-POST — Posterior"],
      ["ALONG-ANT", "ALONG-ANT — Anterior"],
      ["ALONG-LAT", "ALONG-LAT — Lateral / rotadores"],
      ["ALONG-OML", "ALONG-OML — Ombro"],
    ],
  },
  {
    grupo: "Cardio",
    opts: [
      ["LOCO", "LOCO — Locomoção (caminhada / corrida / elíptico)"],
      ["CICL", "CICL — Ciclismo"],
      ["EC+REM", "EC+REM — Remo ergométrico"],
    ],
  },
];

export const REGIOES_DOR: { cod: "L0" | "L1" | "L2" | "L3" | "L_MULTI"; nome: string }[] = [
  { cod: "L0", nome: "L0 · Sem dor" },
  { cod: "L1", nome: "L1 · Lombar/Coluna" },
  { cod: "L2", nome: "L2 · Joelho" },
  { cod: "L3", nome: "L3 · Ombro" },
  { cod: "L_MULTI", nome: "L_MULTI · Multi-região" },
];

export const STEPS = [
  "Nome",
  "Bloco",
  "Equipamento",
  "Nível",
  "Detalhes",
  "Contexto",
  "Confirmar",
] as const;

/**
 * Converte o nível JMP (BI/BII/BIII/IN1/IN2/IN3) no nível visível para o cliente
 * (Iniciante / Intermediário / Avançado). Esse é o campo `level` da tabela exercises
 * usado pelos filtros públicos, pelo agente legado e pela tabela /exercises.
 */
export const mapJmpLevelToClientLevel = (
  code: LevelCode | null | undefined
): "Iniciante" | "Intermediário" | "Avançado" => {
  switch (code) {
    case "BI":
    case "BII":
      return "Iniciante";
    case "BIII":
    case "IN1":
      return "Intermediário";
    case "IN2":
    case "IN3":
      return "Avançado";
    default:
      return "Iniciante";
  }
};

/** Equipamento legível a partir do código JMP (para preencher exercises.equipment[]). */
export const equipCodeToHumanName = (equip: EquipCode | null | undefined): string | null => {
  if (!equip) return null;
  const map: Record<EquipCode, string> = {
    PC: "Peso Corporal",
    ELAS: "Elástico",
    MAC: "Máquina",
    DIV: "Articulado DIV",
    CONV: "Articulado CONV",
    CAB: "Cabo / Polia",
    BAR: "Barra Livre",
    HAL: "Halter",
  };
  return map[equip] ?? null;
};

/** Movimento dominante derivado do bloco — usado pelos agentes para análise muscular. */
export const blockToDominantMovement = (block: BlockCode | null | undefined): string | null => {
  if (!block) return null;
  const map: Record<BlockCode, string> = {
    MOB: "Mobilidade",
    FORT: "Fortalecimento",
    MS: "Empurrar/Puxar",
    MI: "Agachar/Estender",
    CARD: "Locomoção",
    ALONG: "Alongamento",
  };
  return map[block];
};

/** Classe biomecânica padrão por bloco. */
export const blockToBiomechanicalClass = (
  block: BlockCode | null | undefined
): string | null => {
  if (!block) return null;
  if (block === "MS" || block === "MI" || block === "FORT") return "Cadeia Fechada";
  if (block === "CARD") return "Cíclica";
  return "Mobilidade";
};

