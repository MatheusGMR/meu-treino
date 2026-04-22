

# Revisão da Jornada de Execução de Treino

Vou refinar a tela `WorkoutSessionExecution` para criar um fluxo guiado por vídeo + áudio descritivo, com botão único contextual e gestão inteligente de séries/peso.

## Visão Geral do Fluxo Proposto

```text
┌─────────────────────────────────────────────────────────┐
│ 1. PREPARAÇÃO       │ Vídeo de preparação roda em loop  │
│  (Estado: prepare)  │ → Botão grande: "COMEÇAR"         │
├─────────────────────────────────────────────────────────┤
│ 2. EXECUÇÃO         │ Vídeo do exercício (auto-play)    │
│  (Estado: execute)  │ Campo "Carga (kg)" abaixo (edit)  │
│                     │ Indicador de série atual (1/3)    │
│                     │ → Botão: "CONCLUIR SÉRIE"         │
├─────────────────────────────────────────────────────────┤
│ 3. DESCANSO         │ Timer circular + áudio "descanse" │
│  (Estado: rest)     │ → Botão: "PRÓXIMA SÉRIE" (após)   │
├─────────────────────────────────────────────────────────┤
│ 4. CONCLUÍDO        │ Animação de check                 │
│  (Estado: done)     │ → Auto-avança próximo exercício   │
└─────────────────────────────────────────────────────────┘
```

## Mudanças por Arquivo

### 1. Banco de Dados (migração)
- **`exercises`**: adicionar `preparation_video_url` (text) e `preparation_description` (text) — vídeo curto opcional para preparação/setup do exercício.
- **`session_completions`**: já existe; vamos garantir que `weight_used` aceite o último peso usado por exercício.
- **Nova função RPC `get_last_weight_for_exercise(client_id, exercise_id)`**: retorna o último `weight_used` registrado, para sugerir como padrão na próxima execução (memória inteligente de carga).

### 2. `WorkoutSessionExecution.tsx` — Refatoração de máquina de estados
Substituir o controle disperso (`showRestTimer`) por um único estado:
```ts
type Phase = "prepare" | "execute" | "rest" | "done";
```
- Cada exercício começa em `prepare` se houver `preparation_video_url`, senão pula direto para `execute`.
- Botão principal único, contextual (CTA grande no rodapé):
  - `prepare` → **"COMEÇAR"**
  - `execute` → **"CONCLUIR SÉRIE X"**
  - `rest` → **"PRÓXIMA SÉRIE"** (habilitado quando timer terminar; permite pular)
  - última série + último exercício → **"FINALIZAR TREINO"**
- Remover navegação manual prev/next durante execução (substituir por botão discreto "Pular exercício" no menu de overflow), evitando confusão.

### 3. `ExerciseVideoPlayer.tsx` — Auto-play e loop
- Aceitar prop `autoplay` e `loop`.
- Para YouTube: usar parâmetros `?autoplay=1&loop=1&playlist=ID&mute=0&controls=1` (mute inicial só para garantir autoplay em mobile, com botão "Ativar áudio" sobreposto).
- Para fase de preparação: vídeo em loop até clicar "Começar".
- Para fase de execução: vídeo toca uma vez, ao terminar dispara callback para destacar botão "Concluir Série" (pulse animation).

### 4. `SeriesTracker.tsx` — Simplificar e integrar com peso sugerido
- Remover botão interno "Concluir Série" (vai para o CTA principal do container).
- Manter campo **Carga (kg)** editável, pré-preenchido com último peso registrado via RPC (`get_last_weight_for_exercise`).
- Esconder campo de peso para exercícios sem carga (mobilidade, alongamento) — detectar via `exercise_type !== "Musculação"`.
- Indicador visual compacto da série atual (chips 1/2/3).
- Expor handler `onCompleteSet` para o pai chamar.

### 5. `RestTimer.tsx` — Auto-start e callback
- Iniciar automaticamente ao entrar na fase `rest`.
- Ao zerar, manter visível mas habilitar botão "Próxima Série" no CTA pai (sem auto-avanço — o usuário decide quando está pronto).
- Adicionar feedback sonoro opcional (beep curto via Web Audio API) ao terminar.

### 6. Áudio descritivo
- **Implementação**: `SpeechSynthesisUtterance` (Web Speech API, já usado no daily check-in conforme memória).
- Falas contextuais em pt-BR:
  - Início de preparação: lê `preparation_description` do exercício.
  - Início de execução: "Série X de Y. Vamos lá."
  - Fim de série: "Boa! Descanse Z segundos."
  - Fim de descanso: "Pronto para a próxima série."
- Toggle global de áudio (ícone alto-falante no header) salvo em `localStorage`.

### 7. Integração com banco
- Cada `Concluir Série` continua chamando `useCompleteSet` (insere em `session_completions` com `weight_used`, `reps_completed`, `rest_time_used`).
- Ao concluir todas as séries do último exercício: chama `useCompleteSession` (atualiza `daily_workout_schedule.completed=true`).
- Trigger existente `increment_completed_sessions` e `update_frequencia_semanal_and_alert` continuam funcionando sem mudanças.
- Para clientes do Protocolo Destravamento (`client_workouts.workout_type='protocolo_destravamento'`), o `MandatoryVideoModal` continua sendo exibido antes da preparação, conforme já implementado na Fase 3.

## Detalhes Técnicos

- **Estado da sessão**: `useReducer` em vez de múltiplos `useState` para garantir transições atômicas entre fases.
- **Persistência local**: salvar progresso em `sessionStorage` (`workout-progress-{sessionId}`) para resistir a reload acidental.
- **Acessibilidade**: botão CTA com `aria-label` dinâmico; respeitar `prefers-reduced-motion` para a animação de pulse.
- **Mobile-first**: layout otimizado para 390px (vídeo no topo 16:9, CTA fixo no rodapé com `safe-area-inset-bottom`).
- **Performance**: pré-carregar thumbnail do próximo exercício durante o descanso.

## Arquivos Afetados
- `supabase/migrations/<novo>.sql` — colunas `preparation_video_url`, `preparation_description` + função `get_last_weight_for_exercise`.
- `src/integrations/supabase/types.ts` — auto-regenerado.
- `src/pages/client/WorkoutSessionExecution.tsx` — refatoração completa para máquina de estados.
- `src/components/client/ExerciseVideoPlayer.tsx` — autoplay/loop/onEnd.
- `src/components/client/YouTubePlayer.tsx` — aceitar params autoplay/loop/mute.
- `src/components/client/SeriesTracker.tsx` — simplificar + peso sugerido.
- `src/components/client/RestTimer.tsx` — auto-start + callback.
- `src/hooks/useSessionCompletion.ts` — adicionar `useLastWeightForExercise(clientId, exerciseId)`.
- `src/hooks/useExerciseAudioCues.ts` (novo) — wrapper Web Speech API + toggle localStorage.
- `src/lib/schemas/exerciseSchema.ts` — incluir `preparation_video_url` e `preparation_description` (opcionais) para o trainer cadastrar.
- `src/components/exercises/ExerciseDialog.tsx` — campos no formulário de exercício.

