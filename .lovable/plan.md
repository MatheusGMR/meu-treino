

## Diretrizes do Agente IA — Plano Revisado

Implementação **completa e sólida** das diretrizes, com coexistência dos dois agentes (generativo para clientes regulares, determinístico para Protocolo Destravamento) e check-in **aberto com perguntas contextuais por horário/dia**.

---

### Ajustes incorporados

**1. Check-in permanece aberto (áudio livre), com pergunta contextual**
A captura segue por áudio (Web Speech API atual), mas o **prompt visual** muda conforme momento:

| Contexto detectado | Pergunta sugestiva |
|---|---|
| Manhã (5h–11h) + dia útil | "Bom dia! Como acordou hoje? Dormiu bem antes do trabalho?" |
| Manhã + fim de semana | "Bom dia! Como está se sentindo neste fim de semana?" |
| Tarde (12h–17h) + dia útil | "Como está sendo o dia de trabalho? Cansaço, dor, estresse?" |
| Tarde + fim de semana | "Como está a tarde? Animado pro treino?" |
| Noite (18h–23h) + dia útil | "Dia puxado? Conta como está chegando pro treino." |
| Noite + fim de semana | "Como foi o dia? Pronto pra movimentar?" |
| Madrugada (0h–4h) | "Treino noturno! Como está o corpo agora?" |

A IA (Lovable Gemini, já em uso) extrai do áudio aberto: `dor_cat (D0–D3)`, `dor_local[]`, `disposicao (OK/Moderada/Comprometida)`, `tempo_disponivel_cat (T1/T2/T3)`, e mantém o `transcription` literal para alimentar `user_vocab[]`.

**2. Coexistência dos dois agentes**
- `workout_type = 'standard'` → agente generativo atual (LLM livre, prompt em `ai_agent_config`).
- `workout_type = 'protocolo_destravamento'` → agente determinístico novo (motor de regras `agent-build-session`), sem LLM na montagem (LLM só calibra texto final do template).
- Um único componente UI (`DailyCheckinDialog`) com pergunta contextual; o backend roteia para o agente correto baseado no `workout_type` ativo do cliente.

**3. Execução sólida — em 3 fases sequenciais com validação ao fim de cada uma**

---

### Fase 1 — Fundação (schema + seed + alertas)

**Migration SQL** (uma só, atômica):
- Novos enums: `dor_categoria` (D0/D1/D2/D3), `inseguranca_categoria` (I1/I2/I3), `tempo_categoria` (T1/T2/T3), `disposicao_categoria` (OK/Moderada/Comprometida), `perfil_comportamental` (01–06), `condicao_medica_flag`, `alert_type_enum`, `alert_severity_enum`, `milestone_type_enum`.
- `anamnesis` ALTER ADD: `dor_cat`, `dor_local[]`, `ins_cat`, `autonomia`, `perfil_primario`, `motivacao_real`, `experiencia_previa`, `abandono_previo`, `rotina_tipo`, `periodo_preferido`, `compromisso`, `frequencia_esperada`, `alert_medical`, `condicao[]`, `medicamento`, `user_vocab[]`.
- Novas tabelas: `daily_checkin_sessions` (substitui gradualmente `daily_checkins` mantendo retrocompat), `protocol_milestones`, `agent_communication_templates`, `agent_videos`, `agent_alerts`, `client_exercise_first_use`, `client_protocol_progress` (sessao_atual, dor_consecutiva, frequencia_semanal).
- Triggers SQL: atualização automática de `dor_consecutiva` e `frequencia_semanal`, criação automática de `agent_alerts` (frequencia_zero, dor_persistente, alerta_medico).
- RLS: clientes leem próprios dados; JMP/admin gerenciam alertas e templates.

**Seeds** (edge function `seed-agent-rules` invocada manualmente uma vez):
- 9 marcos do documento (sessões 1, 6, 12, 13, 18, 24, 25, 30, 36).
- Templates de comunicação para cada combinação `perfil_primario × ins_cat × moment`.
- Vídeos VID-INTRO-01, VID-INTRO-02, VID-PROG-B2, VID-PROG-B3, VID-FIM-01, VID-ENC-I3-03, etc.

**Painel JMP** (`/admin/jmp-alerts`):
- Lista realtime de alertas via Supabase Realtime.
- Filtros por tipo/severidade/status.
- Ação "marcar como resolvido" + nota.
- Toast global para usuários `admin`/`jmp` quando novo alerta surge.

**Validação Fase 1**: criar 1 alerta manual, conferir realtime + resolver. Conferir que nenhum dado existente foi perdido.

---

### Fase 2 — Check-in contextual + Anamnese estendida

**Check-in contextual aberto**:
- Extender `DailyCheckinDialog` para detectar `hora_atual` + `dia_semana` + `rotina_tipo` da anamnese e exibir pergunta da matriz acima.
- Áudio livre permanece. Edge function `analyze-checkin` ganha novo system prompt que extrai categóricos (D, T, disposição) **além** de manter resumo livre.
- Salva em `daily_checkin_sessions` (novo) com `tempo_cat`, `dor_cat_dia`, `dor_local_dia[]`, `disposicao`, `hora_atual`, `dia_util`, `transcription`, `vocab_capturado[]`. Mantém escrita em `daily_checkins` por compatibilidade.

**Anamnese estendida**:
- Novas etapas no formulário existente (`ClientAnamnesis.tsx`): perfil comportamental (6 cards visuais para escolher entre os 6 perfis), insegurança (slider I1–I3), compromisso semanal, rotina (manhã/tarde/noite, dia útil/livre), motivação literal (texto livre).
- Edge function `calculate-anamnesis-profile` estendida para computar `perfil_primario`, `ins_cat`, `dor_cat`, `alert_medical`, `user_vocab[]` (extraído via NLP do `motivacao_real`).
- Trigger automático: se `alert_medical=true`, cria `agent_alert` tipo `alerta_medico` antes da Sessão 1.

**Validação Fase 2**: completar uma anamnese de teste com cada perfil; fazer 3 check-ins em horários diferentes e conferir pergunta correta + extração categórica salva.

---

### Fase 3 — Motor determinístico + Marcos + UI cliente

**Edge function `agent-build-session`** (verify_jwt=true):
- Roteamento: chamada apenas se `client_workouts.workout_type = 'protocolo_destravamento'`.
- Implementa hierarquia: `Dor D3 > Dor D2 > Tempo > Disposição > Insegurança > Alternância A/B > Mobilidade(nunca suprime)`.
- 16 passos do pseudocódigo da seção 11 do documento.
- Filtro SEG por `ins_cat` (I1/I2 → S1–S2; I3 → apenas S1) usando `exercises.safety_level`.
- Verifica marco da sessão atual em `protocol_milestones`; se houver, dispara vídeo obrigatório + ação JMP.
- Retorna sessão montada + texto calibrado (template + `user_vocab` + `nome`).
- Atualiza `client_protocol_progress`.

**UI cliente Protocolo**:
- `MilestoneIndicator` no dashboard: "Sessão X de 36 · Bloco Y".
- Modal de vídeo obrigatório que **bloqueia** início da sessão até término (apenas em sessões de marco).
- Mensagem de pré-sessão usa template calibrado.

**Reformulação de `AIAgentSettings`**:
- Aba "Agente Padrão" (existente, edição livre de prompt) — para clientes `standard`.
- Aba "Agente Protocolo" (nova, somente leitura de regras + edição de templates) — lista marcos, regras, templates.
- Botão admin "Re-importar diretrizes" reexecuta `seed-agent-rules`.

**Validação Fase 3**: rodar protocolo completo de teste (sessão 1 → marco → sessão 6 → revisão I3 → sessão 12 → encerra bloco). Conferir alertas JMP em cada gatilho. Conferir que cliente `standard` continua com agente generativo intacto.

---

### Critérios de "perfeito funcionamento"

Antes de marcar cada fase como concluída:
1. Migration aplicada sem warnings do linter Supabase.
2. RLS testada com 3 perfis (cliente protocolo, cliente standard, admin/JMP).
3. Realtime funcionando no painel JMP (alerta criado em <2s).
4. Check-in mostra pergunta correta nos 7 contextos (manhã/tarde/noite × útil/fim de semana + madrugada).
5. Cliente standard intocado: workout_type='standard' continua usando agente generativo.
6. Console limpo, sem erros de tipos TS após regeneração de `types.ts`.

---

### Arquivos novos/alterados

**Migrations**: `<ts>_agent_foundations.sql`, `<ts>_agent_alerts_triggers.sql`, `<ts>_anamnesis_extended.sql`

**Edge functions novas**: `seed-agent-rules`, `agent-build-session`, `agent-daily-tick` (cron)

**Edge functions estendidas**: `analyze-checkin` (extração categórica), `calculate-anamnesis-profile` (perfil comportamental)

**Páginas novas**: `src/pages/admin/JmpAlerts.tsx`

**Componentes novos**: `MilestoneIndicator.tsx`, `MandatoryVideoModal.tsx`, `ContextualCheckinPrompt.tsx`, `BehavioralProfileSelector.tsx`

**Componentes alterados**: `DailyCheckinDialog.tsx`, `AIAgentSettings.tsx`, `ClientAnamnesis.tsx`, `AppSidebar.tsx` (item JMP), `App.tsx` (rota)

**Hooks novos**: `useContextualCheckinPrompt.ts`, `useProtocolProgress.ts`, `useJmpAlerts.ts`

---

### Ordem de execução

1. Fase 1 (fundação) → você valida painel JMP.
2. Fase 2 (check-in + anamnese) → você valida fluxo de captura.
3. Fase 3 (motor + UI) → você valida protocolo end-to-end.

Cada fase entra em uma única leva de mudanças, com a migration aprovada antes do código que depende dela.

