## Objetivo

Incorporar a Unificação v3.0 do motor JMP: motor único entre simulador e cliente real, RPC corrigida (D3 cirúrgico, L_MULTI, Safety I→S), check-in/feedback estruturados em botões, e botão "Ficou leve?" durante a execução.

## Escopo (6 arquivos)

### 1. Migração SQL — RPC `select_session_exercises` reescrita
**Arquivo:** `supabase/migrations/20260501120000_unificacao_motor_v3.sql`

Aplicar via tool de migração. Reescreve a RPC com:
- **L_MULTI tratado:** itera sobre cada local em `dor_local[]` para MOB, FORT e ALONG (antes era ignorado, deixando o aluno sem exercícios por dor).
- **Safety corrigido:** `I1→S2`, `I2→S2`, `I3→S1` (antes era I1→S5/I2→S4/I3→S3, fora da diretriz JMP).
- **D3 = remoção cirúrgica:** `REMOVE_LOCAL` remove apenas exercícios do local de dor (todos os locais quando L_MULTI), preservando o restante do resistido.
- Novo campo no retorno: `dor_locals` (array completo, para auditoria).
- `REVOKE` de `PUBLIC/anon` + `GRANT EXECUTE` para `authenticated`.

### 2. Edge Function — Simulador unificado
**Arquivo:** `supabase/functions/simulate-protocol-session/index.ts` (substituir conteúdo)

Reescrita completa: remove toda lógica própria de seleção (intensity_factor, allowed_safety, max_exercises hardcoded). Agora:
- Cria/atualiza dados temporários (anamnese + check-in + progresso) num "cliente simulação" com UUID fixo.
- Chama a mesma RPC `select_session_exercises` que o motor real.
- Retorna o resultado no mesmo formato. Garante paridade simulador ↔ cliente.

### 3. UI Simulador
**Arquivo:** `src/components/admin/ProtocolSimulator.tsx` (substituir conteúdo)

- Labels Tempo: T1=30-40min (3-5 ex), T2=40-50min (4-6 ex), T3=50-60min (6-8 ex).
- Labels Dor: D3 = "Limitante (remoção cirúrgica do local)".
- Labels Insegurança: I1=S2, I2=S2, I3=S1.
- Remove percentuais inexistentes de Disposição.
- Novo seletor: **Nível de Experiência** (iniciante/intermediário/avançado).
- Resultado renderizado por bloco (MOB / FORT / RESIST / ALONG) ao invés de lista plana.
- Interface `SimResult` adaptada ao formato da RPC.

### 4. Check-in Estruturado (novo)
**Arquivo:** `src/components/client/StructuredCheckinDialog.tsx` (criar)

Fluxo Typeform-style com botões fixos, sem voz/IA:
- Tela 1: Tempo (T1/T2/T3).
- Tela 2: Dor (D0–D3) — só aparece se anamnese registra dor.
- Tela 2b: Local da dor (Lombar/Ombro/Joelho, multi-select) — só se D>0.
- Tela 3: Disposição contextualizada por horário (manhã: "Dormiu bem?"; tarde: "Muito cansado do dia?"; noite: "Como foi o dia?").
- Grava direto em `daily_checkin_sessions`.

`DailyCheckinDialog` (voz) permanece como alternativa.

### 5. Feedback Pós-Sessão Estruturado (novo)
**Arquivo:** `src/components/client/StructuredFeedbackDialog.tsx` (criar)

Máximo 4 toques:
1. "Como você está saindo daqui?" → Bem / Cansado mas bem / Senti algo
2. (se "Senti algo") "Onde foi o desconforto?" → Lombar/Joelho/Ombro/Outra
3. (se "Senti algo") "Como foi a intensidade?" → Leve/Normal/Puxado
4. Encerra. Chama `submit-post-session-feedback` (já trata `dor_nova`).

### 6. Execução de treino — botão "Ficou leve?"
**Arquivo:** `src/pages/client/WorkoutSessionExecution.tsx` (editar)

Na fase `rest` entre séries, adicionar botão discreto "Ficou leve?" que chama `record-perception-signal` com `signal_type: "ESPONTANEO_LEVE"`. Trigger SQL existente (`check_gatilho_potencial`) avalia 2× consecutivos = alerta JMP automático.

## Não incluído nesta entrega (do changelog "ainda falta")

- Randômico (perguntas a cada 3-4 sessões).
- Pergunta de cardio no check-in.
- Integração de vídeos D2/D3 na UI de execução (RPC `get_videos_for_session_moment` já existe).
- Trocar default `DailyCheckinDialog` → `StructuredCheckinDialog` na rotina diária.
- Trocar default `PostWorkoutFeedbackDialog` → `StructuredFeedbackDialog`.

Posso seguir com essas 5 trocas de default + integrações em uma segunda rodada após validar o motor unificado. Ou já incluo as duas trocas de default agora — me avise.

## Riscos / observações

- A RPC nova mantém a mesma assinatura `(uuid, integer)` → não quebra `agent-build-session`.
- Simulador usa UUID fixo `00000000-0000-0000-0000-sim000000001`; precisa que ele não exista como cliente real (é). Os upserts garantem idempotência.
- Mudança de Safety (I→S2/S1) reduz o pool de exercícios elegíveis para resistido. Após a migração, revisar no Simulador alguns cenários para conferir que ainda há exercícios suficientes para todos os perfis. Se o pool ficar curto, ajusto a regra ou populo a base.
- Após a migração, a função `linter` será executada — se aparecer warning de `SECURITY DEFINER`, é esperado pois a RPC já era assim.

## Plano de execução

1. Aplicar migração SQL (RPC v3).
2. Substituir `simulate-protocol-session/index.ts` (deploy automático).
3. Substituir `ProtocolSimulator.tsx`.
4. Criar `StructuredCheckinDialog.tsx` e `StructuredFeedbackDialog.tsx`.
5. Editar `WorkoutSessionExecution.tsx` adicionando o botão "Ficou leve?" no `rest`.
6. Rodar linter Supabase e checar logs do simulador com 1–2 cenários.
