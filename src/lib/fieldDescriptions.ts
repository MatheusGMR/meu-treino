export const FIELD_DESCRIPTIONS = {
  method: {
    objective: {
      "Hipertrofia": "Foco em ganho de massa muscular através de tensão mecânica e tempo sob tensão moderado",
      "Força": "Desenvolvimento de força máxima com cargas elevadas (>85% 1RM) e baixas repetições",
      "Resistência": "Melhora da capacidade muscular de suportar esforço prolongado com alta densidade de trabalho",
      "Potência": "Combinação de força e velocidade para movimentos explosivos e rápidos",
      "Hipertrofia + Força": "Equilibra ganho de massa muscular com ganhos de força",
      "Força + Hipertrofia": "Prioriza força com benefícios secundários de hipertrofia",
      "Equilíbrio / Hipertrofia": "Foco principal em hipertrofia com trabalho equilibrado entre grupos musculares",
      "Hipertrofia pesada": "Uso de cargas pesadas (80-90% 1RM) focado em hipertrofia miofibrilar",
      "Força + Potência": "Desenvolvimento de força máxima com componentes de explosão",
    },
    risk_level: {
      "Baixo risco": "Método seguro para a maioria dos praticantes, baixo estresse articular e neural",
      "Médio risco": "Requer técnica adequada e supervisão. Estresse moderado nas articulações e sistema nervoso",
      "Alto risco": "Apenas para praticantes avançados. Alto estresse articular e risco de lesão se mal executado",
      "Alto risco de fadiga": "Gera fadiga neural significativa. Usar com moderação e períodos de recuperação adequados",
    },
    energy_cost: {
      "Alto": "Alta demanda metabólica. Ideal para emagrecimento ou final de treino. Requer recuperação adequada",
      "Médio": "Demanda energética equilibrada. Pode ser usado ao longo de toda sessão sem fadiga excessiva",
      "Baixo": "Baixa demanda metabólica. Ideal para exercícios de isolamento, técnica ou aquecimento",
    },
    load_level: "Nível de carga: Alta (85-100% 1RM - Força), Média (65-85% 1RM - Hipertrofia), Baixa (40-65% 1RM - Resistência/Técnica)",
    cadence_contraction: "Tempo em segundos para a fase concêntrica (contração/subida). Ex: 2s = ritmo moderado, 1s = explosivo",
    cadence_pause: "Tempo em segundos de pausa/isometria no pico da contração. Ex: 1s = pausa breve, 0s = sem pausa",
    cadence_stretch: "Tempo em segundos para a fase excêntrica (alongamento/descida). Ex: 3-4s = controle total, 2s = moderado",
    rest_seconds: "Tempo de descanso entre séries em segundos. Força: 180-300s, Hipertrofia: 60-120s, Resistência: 30-60s",
  },
  volume: {
    num_series: "Quantidade de séries executadas por exercício nesta configuração de volume",
    num_exercises: "Quantidade de exercícios diferentes que utilizam este volume na mesma sessão",
    min_weekly_sets: "Mínimo de séries semanais para o grupo muscular estimular adaptação (baseado em literatura científica)",
    optimal_weekly_sets: "Volume ótimo semanal para máxima hipertrofia sem sobretreinamento. Zona de crescimento ideal",
    max_weekly_sets: "Limite superior semanal antes de risco de overreaching e fadiga excessiva",
    movement_pattern: "Padrão de movimento (ex: Push/Pull/Legs, Upper/Lower). Ajuda a organizar distribuição de volume",
    goal: "Objetivo principal deste volume (ex: Hipertrofia Intermediário, Força Avançada)",
  },
  exercise: {
    impact_level: {
      "Baixo": "Mínimo estresse articular. Seguro para reabilitação e pessoas com limitações",
      "Médio": "Estresse moderado nas articulações. Adequado para maioria dos praticantes saudáveis",
      "Alto": "Alto estresse articular e axial. Evitar para pessoas com problemas articulares, coluna ou joelhos",
    },
    biomechanical_class: "Classificação biomecânica do movimento (ex: Cadeia cinética aberta/fechada, Multiarticular/Monoarticular)",
    dominant_movement: "Padrão de movimento principal (ex: Empurrar horizontal, Puxar vertical, Extensão de quadril)",
    primary_muscle: "Músculo ou grupo muscular que recebe maior ativação e tensão durante o exercício",
    secondary_muscle: "Músculos auxiliares que trabalham de forma secundária durante o movimento",
    level: "Nível de complexidade técnica: Iniciante (movimentos simples), Intermediário (técnica moderada), Avançado (alta complexidade)",
  },
  session: {
    session_type: {
      "Musculação": "Sessão focada em exercícios de força, hipertrofia e resistência muscular com sobrecarga",
      "Mobilidade": "Exercícios para amplitude de movimento, preparação articular e ativação muscular pré-treino",
      "Alongamento": "Foco em flexibilidade passiva, relaxamento muscular e recuperação pós-treino",
    },
  },
  workout: {
    training_type: {
      "Hipertrofia": "Treino focado primariamente em ganho de massa muscular através de volume e tensão",
      "Emagrecimento": "Combinação de trabalho de resistência muscular e alta densidade para gasto calórico elevado",
      "Musculação": "Treino geral de fortalecimento muscular equilibrado entre força e hipertrofia",
      "Funcional": "Movimentos integrados focados em função, mobilidade e padrões motores do dia-a-dia",
      "Outro": "Treino com objetivos específicos personalizados não categorizados acima",
    },
    level: {
      "Iniciante": "Para pessoas com menos de 6 meses de treino. Foco em técnica e adaptação",
      "Avançado": "Para praticantes com +6 meses de treino regular. Maior volume e intensidade",
    },
  },
};
