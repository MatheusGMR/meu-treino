
## Diagnóstico — o que os 4 documentos exigem vs. o que existe

Comparando os PDFs (Anamnese, Outputs Triagem v2 com 30 combinações, Diretriz de Volume, Feedback & Progressão) com a base atual, há um descasamento importante: hoje a seleção de exercícios usa apenas `safety_level` + `dor_local` como filtro genérico (`agent-build-session/index.ts`). As diretrizes exigem uma **matriz determinística** baseada em 6 variáveis com hierarquia rígida.

### Variáveis que devem governar o ID dos exercícios escolhidos

| # | Variável | Origem | Função no banco hoje | Status |
|---|----------|--------|----------------------|--------|
| 1 | T (T1/T2/T3) | Triagem diária | `daily_checkin_sessions.tempo_cat` | ✅ existe |
| 2 | D (D0/D1/D2/D3) | Triagem diária | `dor_cat_dia` | ✅ existe |
| 3 | Disposição (OK/Mod/Comp) | Triagem | `disposicao` | ✅ existe |
| 4 | Local da dor (L0/L1/L2/L3/L_multi) | Perfil anamnese | `anamnesis.dor_local` (array) | ⚠️ falta `L_multi` e flag |
| 5 | Insegurança (I1/I2/I3) | Perfil anamnese | `anamnesis.ins_cat` | ✅ existe |
| 6 | Bloco+Treino (B1A..B3B) + sessão | Histórico protocolo | `client_protocol_progress.bloco_atual/sessao_atual` | ✅ existe |
| 7 | Experiência (Iniciante/Inter/Avançado) | Anamnese | `anamnesis.nivel_experiencia` (texto) | ⚠️ não normalizado |

### Gaps críticos identificados

**A. Tabela `exercises` (campos faltantes para seleção determinística)**
- Não há campo distinguindo **PAI vs SUB** (versão completa vs sub-exercício) — o doc Volume exige isso para D0 (PAI), D1/D2 (SUB do local), D3 (remove local).
- `substitution_id` existe mas vazio; falta `parent_exercise_id` para a relação PAI→SUB.
- Não existe `pain_region` (L1/L2/L3) explícito — hoje usa `exercise_group` genérico.
- Falta `treino_letra` (A/B) e `bloco_protocolo` (B1/B2/B3) para casar com o histórico.
- Não existe `is_primary_exercise` (necessário para feedback randômico — Supino/Remada/Leg Press/Cadeira).
- Banco está vazio de exercícios `protocol_only=true` (0 registros) — seed pendente.

**B. Tabela `methods` / Volume**
- Não há tabela `volume_outputs` materializando os 30 IDs OUT-001..OUT-030 (T×D×Disp → N_Ex, séries, regra de mobilidade/fortalecimento/resistido/alongamento).
- A função `agent-build-session` não consulta essa matriz — usa heurística simplificada.

**C. Anamnese — variáveis incompletas**
- `autonomia` (A1/A2/A3) não existe na tabela `anamnesis`.
- Flags `flag_frustrado`, `multi_dor` não existem.
- `user_vocab[]` existe (`user_vocab` array) ✅.
- `nivel_experiencia` é texto livre — precisa normalizar para enum `iniciante|intermediario|avancado`.

**D. Feedback & Progressão (doc 4)**
- **Não existe** `session_perception_signals` (botão "Ficou leve?" e randômico).
- **Não existe** `client_exercise_load_history` (carga atual por exercício/cliente).
- **Não existe** lógica de presunção de conclusão (`PRESUMIDO`/`AUTO_CONCLUIDA`/`PARCIAL`/`AUSENTE`) — `daily_workout_schedule.completed` é booleano simples.
- Alertas `GATILHO_POTENCIAL`, `PESADO_RECORRENTE`, `DOR_NOVA`, `DOR_ESCALADA`, `AUSENCIA`, `NAO_CONCLUIU` não estão no enum `alert_type_enum` (atual: `frequencia_zero, frequencia_baixa, dor_persistente, sessao_sem_feedback, revisao_nivel_I3, alerta_medico, condicao_cardiaca, inconsistencia_checkin, divergencia_conduta`).
- Schedule de perguntas randômicas (S3, S5, S7, S11, S13, S17, S21, S23, S27, S31, S35) não está modelado.

**E. RPC de seleção determinística**
- Não existe `select_session_exercises(client_id, sessao_num)` — coração do sistema.
- A `agent-build-session` faz hoje uma triagem ad-hoc; precisa ser substituída por RPC SQL pura para garantir reprodutibilidade.

---

## Plano de Ajustes (5 fases)

### Fase 1 — Schema: variáveis de governo dos IDs

**1.1 Enums novos**
```
exercise_kind_enum = ('PAI', 'SUB')
pain_region_enum   = ('L0','L1','L2','L3','L_MULTI')   -- L1=lombar, L2=ombro, L3=joelho
nivel_experiencia_enum = ('iniciante','intermediario','avancado')
autonomia_enum     = ('A1','A2','A3')
session_status_enum= ('CONCLUIDA','AUTO_CONCLUIDA','PARCIAL','AUSENTE','PRESUMIDO')
treino_letra_enum  = ('A','B')
```
Estender `alert_type_enum` com: `gatilho_potencial`, `pesado_recorrente`, `dor_nova`, `dor_escalada`, `ausencia`, `nao_concluiu`.

**1.2 Colunas em `exercises`** (todas nullable, retro-compatível)
- `kind exercise_kind_enum` — PAI ou SUB
- `parent_exercise_id uuid` — FK para o PAI quando kind=SUB
- `pain_region pain_region_enum` — região-alvo (lombar/joelho/ombro)
- `treino_letra treino_letra_enum` — A ou B (banco resistido)
- `bloco_protocolo int` — 1, 2 ou 3 (B1/B2/B3)
- `is_primary boolean default false` — supino/remada/leg press/cadeira (alvo do randômico)
- `is_fixed_base boolean default false` — base fixa de mobilidade/fortalecimento (3 IDs por treino)

**1.3 Colunas em `anamnesis`**
- `autonomia autonomia_enum`
- `flag_frustrado boolean`
- `multi_dor boolean`
- `nivel_experiencia_norm nivel_experiencia_enum` (preenchido por trigger a partir do texto atual)

**1.4 Tabela nova: `volume_outputs`** (materializa as 30 combinações OUT-001..OUT-030)
```
id text PK ('OUT-001'..'OUT-030')
tempo_cat, dor_cat, disposicao   -- chave composta
modo_d3 boolean
n_ex_min int, n_ex_max int
series_min int, series_max int
reps int default 12
mob_rule jsonb     -- ex: {"base":"A","local_qty":2}
fort_rule jsonb    -- depende experiencia
resist_rule jsonb  -- {"strategy":"PAI"|"SUB_PRIORITY"|"REMOVE_LOCAL"}
along_rule jsonb
```

### Fase 2 — Tabelas de Feedback & Progressão

**2.1 `client_exercise_load_history`** — carga atual por cliente/exercício
```
client_id, exercise_id, current_load_kg, last_progression_at, progression_count
```

**2.2 `session_perception_signals`** — botão "Ficou leve?" + randômico
```
client_id, session_schedule_id, exercise_id,
signal_type ('ESPONTANEO_LEVE','RANDOMICO_LEVE','RANDOMICO_NORMAL','RANDOMICO_PESADO'),
sessao_num, created_at
```
Trigger: ao acumular ≥2 sinais consecutivos LEVE no mesmo `exercise_id` → cria alerta `gatilho_potencial`.

**2.3 `random_check_schedule`** — sessões alvo do randômico (seed: S3,S5,S7,S9,S11,S13,S17,S21,S23,S27,S31,S35)
```
sessao_num, treino_letra, primary_exercise_slot ('SUPINO'|'REMADA'|'LEG_PRESS'|'CADEIRA_EXT'|'CADEIRA_FLEX'), fase
```

**2.4 Estender `daily_workout_schedule`**
- Trocar `completed boolean` por (manter compat) + adicionar `session_status session_status_enum default 'CONCLUIDA'`.

### Fase 3 — RPC determinística `select_session_exercises`

Função SQL `SECURITY DEFINER` que substitui a lógica do `agent-build-session/index.ts`. Implementa **exatamente** o pseudocódigo da página 6 do doc Outputs:

```
INPUT:  _client_id uuid, _sessao_num int
OUTPUT: jsonb { mobilidade:[ids], fortalecimento:[ids], resistido:[{id,series,reps}], alongamento:[ids], output_id:'OUT-0XX', decisions:[...] }

PASSOS:
1. Carrega perfil (anamnesis): dor_local, ins_cat, nivel_experiencia_norm, autonomia, multi_dor
2. Carrega progresso: bloco_atual, treino (alterna A/B por sessao_num), sessao_num
3. Carrega último check-in: tempo_cat, dor_cat_dia, disposicao, dor_local_dia
4. Busca volume_outputs WHERE tempo=T AND dor=D AND disposicao=disp → output
5. MOBILIDADE: 3 fixos (is_fixed_base=true, bloco=MOB, treino=A/B) + N por dor (filtra pain_region=L)
6. FORTALECIMENTO: aplica regra por nivel_experiencia (iniciante: base+local; inter/av: só com D≥D1)
7. RESISTIDO:
   - candidatos = exercises WHERE protocol_only AND bloco_protocolo=B AND treino_letra=A/B AND safety_level<=teto(ins_cat)
   - SE D=D3: REMOVE WHERE pain_region=L (cirúrgico, mantém o resto)
   - SE D=D2: prioriza kind=SUB AND pain_region=L; remove kind=PAI AND pain_region=L
   - SE D=D1: prioriza kind=SUB AND pain_region=L
   - SE D=D0: prioriza kind=PAI
   - SELECT n_ex (entre n_ex_min e n_ex_max do output)
8. ALONGAMENTO: prioridade absoluta dor; corta musculatura treinada se T1/T2
9. Retorna jsonb + grava decisions[] em log
```

Esta função é **idempotente e auditável**: dada a mesma entrada produz exatamente a mesma saída — base para o "Simulador de Protocolo" do admin.

### Fase 4 — Adaptação do Edge Function & Captura de Sinais

**4.1** Reescrever `agent-build-session/index.ts` para apenas chamar `rpc('select_session_exercises', ...)` e enriquecer com vídeos via RPC já existente `get_videos_for_session_moment`.

**4.2** Novo edge function `record-perception-signal` (POST):
- Recebe `{ exercise_id, signal_type, schedule_id }`
- Insere em `session_perception_signals`
- Roda trigger de gatilho

**4.3** Nova edge function `submit-post-session-feedback`:
- Implementa o fluxo de 4 toques (estado/região/intensidade)
- Detecta `dor_nova` (região fora do mapeamento da anamnese) → alerta JMP silencioso

**4.4** Cron diário `daily-rollover` (existe? caso contrário criar):
- Marca sessões não encerradas como `AUTO_CONCLUIDA` ou `AUSENTE`
- Verifica condições de `ausencia` (2 semanas) e `nao_concluiu` (3 parciais)

### Fase 5 — UI Admin: Visualização e Validação

**5.1 Nova aba "Matriz de Volume" em `ProtocolAgentTab.tsx`**
- Tabela visual dos 30 outputs (T×D×Disp) com edição inline (séries min/max, n_ex)
- Indicador de cobertura: para cada output, quantos exercícios disponíveis no banco

**5.2 Novo painel "Banco do Protocolo" em `/admin/protocol-exercises`**
- Lista exercícios `protocol_only=true` com filtros: kind (PAI/SUB), bloco_protocolo, treino_letra, pain_region
- Editor de relação PAI↔SUB (drag & drop ou select)
- Marcadores `is_primary` / `is_fixed_base`
- Status visual: "Banco insuficiente para B1A+D3+L1" quando faltarem IDs

**5.3 Estender o Simulador atual** (`ProtocolSimulator.tsx`) para mostrar o `output_id` resolvido e o caminho de decisão completo.

---

## Resposta direta à sua pergunta — "quais variáveis determinam o ID do exercício?"

A seleção de **qual ID exato** entra na sessão deve ser determinada pela combinação destas variáveis, com a hierarquia exata do doc Outputs v2:

```
ID escolhido = f(
  [PERFIL FIXO]      pain_region (L), ins_cat (I), nivel_experiencia, autonomia,
  [TRIAGEM DO DIA]   tempo_cat (T), dor_cat (D), disposicao,
  [HISTÓRICO]        bloco_protocolo, treino_letra (A/B), sessao_num, last_load,
  [METADADO DO EX]   kind (PAI/SUB), pain_region do exercício, is_fixed_base, is_primary,
                     safety_level <= teto(I), protocol_only=true
)
```

A hierarquia de precedência é fixa: **D3 > D2 > Tempo > Disposição > Mobilidade (nunca remove) > Fortalecimento (depende de experiência) > Alternância A/B (sempre preservada)**.

Sem as colunas `kind`, `parent_exercise_id`, `pain_region`, `treino_letra`, `bloco_protocolo`, `is_fixed_base` e a tabela `volume_outputs`, é **matematicamente impossível** o sistema reproduzir a matriz JMP. Esses são os ajustes obrigatórios.

---

## Arquivos esperados

**Migrações:**
- `..._extend_exercises_for_protocol.sql` (enums + colunas em exercises/anamnesis)
- `..._volume_outputs_seed.sql` (tabela + seed dos 30 OUT-XXX)
- `..._perception_signals_and_load_history.sql` (tabelas + triggers + alertas)
- `..._select_session_exercises_rpc.sql` (RPC determinística)

**Edge Functions:**
- Reescrever: `supabase/functions/agent-build-session/index.ts`
- Criar: `supabase/functions/record-perception-signal/index.ts`
- Criar: `supabase/functions/submit-post-session-feedback/index.ts`
- Criar/atualizar: `supabase/functions/daily-rollover/index.ts`

**Frontend:**
- Novo: `src/pages/admin/ProtocolBank.tsx` + `ProtocolBankTable.tsx` + `PaiSubLinker.tsx`
- Novo: `src/components/admin/VolumeMatrixTab.tsx` (aba na ProtocolAgentTab)
- Editar: `src/components/admin/ProtocolSimulator.tsx` (mostra output_id e trace)
- Editar: `src/components/sidebar/AppSidebar.tsx` (entrada Repertório → Banco do Protocolo)
- Hooks: `useProtocolExercises.ts`, `useVolumeOutputs.ts`, `usePerceptionSignals.ts`

**Memória a atualizar:**
- `mem://features/protocol-exercise-library` (acrescentar variáveis de seleção)
- Nova: `mem://architecture/exercise-selection-engine` (hierarquia das 6 variáveis + RPC)

---

## Pontos que pedem decisão sua antes de eu implementar

1. **Seed do banco do Protocolo**: você tem a planilha com os IDs JMP (ex: MIMACS1BI003 / MIMACS1BI003a) para eu carregar como seed, ou criamos vazios para o admin preencher?
2. **Migração de dados existentes**: hoje há 0 exercícios `protocol_only=true`. OK começar do zero, sem retrofit?
3. **Escopo desta entrega**: implemento as 5 fases agora, ou começamos pelas Fases 1+3 (schema + RPC) e deixamos UI admin para depois?
