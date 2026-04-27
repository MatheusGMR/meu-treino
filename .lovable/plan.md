
# Implementação do Mapeamento de Vídeos JMP — Fases 1 a 5

Sistema de vídeos contextuais do Protocolo Destravamento, conforme racional do profissional. Trabalho dividido em 5 fases entregues em conjunto.

## Visão geral

```text
┌────────────────────────────────────────────────────────────┐
│ Anamnese  →  ins_cat fixo (I1/I2/I3) — nunca sobe         │
│   ↓                                                        │
│ Sessão N + momento (abertura/antes_bloco/intervalo/...)   │
│   ↓                                                        │
│ RPC get_videos_for_session_moment(client, sessao, momento)│
│   ↓                                                        │
│ Hierarquia: Marco > Modo Seguro > Dor > ENC-I3 > 1ª vez   │
│             exercício > Opcionais do nível                 │
│   ↓                                                        │
│ [VID-..., obrigatorio: true|false, ordem: N]              │
└────────────────────────────────────────────────────────────┘
```

## Fase 1 — Estender `agent_videos`

Migração que adiciona ao schema atual:

- `pilar` (enum): `mobilidade | fortalecimento | resistido | alongamento | encerramento | dor | modo_seguro | intro | progressao | fim`
- `momento` (enum): `abertura | antes_bloco | antes_exercicio | intervalo | pos_sessao | sessao_inteira`
- `obrigatorio` (boolean, default false) — dispara automaticamente sem opção do cliente
- `gatilho` (text) — descrição humana ("Toda sessão — I3 — até sessão 6")
- `sessoes_alvo` (int[]) — sessões específicas (`[1]`, `[6,12,18,24]`, `[36]`)
- `bloco_alvo` (int) — 1, 2 ou 3 (null = qualquer bloco)
- `exercise_id` (uuid, FK para exercises) — nullable, usado pelos VID-RES de setup
- `ordem_sequencia` (int default 0) — ordem dentro do mesmo gatilho (D3 dispara 3 vídeos em sequência)
- Índice composto `(pilar, recommended_for_ins_cat, momento)` para consultas rápidas

**Seed completo** com as ~50 entradas do documento (skeleton — sem `youtube_url`):
- I1: 5 vídeos (MOB, FORT, RES, ALONG, ENC)
- I2: ~12 vídeos
- I3: ~15 vídeos (mais reforço positivo)
- Condição (DOR, MS): 7 vídeos (D1, D2, D3, MS)
- Marcos (INTRO, PROG, FIM): 5 vídeos — já existem 7, complementar/ajustar

Os 7 vídeos já cadastrados (`VID-INTRO-01`, `VID-INTRO-02`, `VID-PROG-B2`, `VID-PROG-B3`, `VID-FIM-01`, `VID-DOR-01`, `VID-ENC-I3-03`) recebem os novos campos via UPDATE.

## Fase 2 — RPC `get_videos_for_session_moment`

Função SECURITY DEFINER que centraliza a hierarquia de disparo (seção 4 do documento):

```text
Input:  client_id, sessao_num, momento, [exercise_id], [dor_cat], [modo_seguro]
Output: Lista ordenada de vídeos { video_code, title, youtube_url, obrigatorio, ordem }

Lógica em camadas (todas aditivas, ordenadas por prioridade):
 1. Marcos obrigatórios (sessao=1 → INTRO; sessao=13 → PROG-B2; sessao=25 → PROG-B3; sessao=36 → FIM)
 2. Modo Seguro ativo → sequência fixa VID-DOR-D3-01 + D3-02 + MS-01
 3. Dor D2/D3 (sem modo seguro) → VID-DOR-D2-* ou D3-*
 4. ENC-I3 obrigatório se ins_cat=I3 e (sessao ≤ 6 OR sessao IN [6,12,18,24])
 5. 1ª vez do exercício (consulta client_exercise_first_use) →
       obrigatório se ins_cat=I3, opcional se I1/I2
 6. Vídeos opcionais do (pilar, ins_cat, momento, bloco_atual)
```

Função consulta `anamnesis.ins_cat`, `client_protocol_progress` (sessão e bloco), `client_exercise_first_use`, e o `daily_checkin_sessions` mais recente para `dor_cat`.

## Fase 3 — Regra "nível nunca sobe" + alerta JMP s.6

Ajuste no edge function `calculate-anamnesis-profile` (já existente) para aplicar a tabela de derivação:

| Insegurança declarada | Experiência prévia | `ins_cat` final | Ação |
|---|---|---|---|
| Alta | Sem | I3 | — |
| Alta | Com | I3 | Cria `agent_alerts` tipo `revisao_nivel_s6` |
| Média | Sem | I2 | — |
| Média | Com | I1 | — |
| Baixa | Sem | I2 | — |
| Baixa | Com | I1 | — |

A insegurança puxa o nível para baixo apenas quando há experiência. Adicionar enum `revisao_nivel_s6` em `alert_type_enum` se não existir.

## Fase 4 — UI Admin: Vídeos do Agente

Nova rota `/admin/agent-videos` separada de "Vídeos de Apoio" (mantém finalidades distintas).

**Página `src/pages/admin/AgentVideos.tsx`**:
- Header com **card de progresso de produção**: "X de Y vídeos com link configurado"
- Filtros: pilar (chips), nível (I1/I2/I3/All), momento, status (com URL / sem URL)
- Grid agrupado por pilar > nível, mostrando código, título, status (✅ link configurado | ⚠️ pendente), badge "obrigatório"
- Botão "Importar mapeamento JMP completo" → executa seed se houver gaps (idempotente)
- Botão por linha: editar / excluir / preview

**Dialog `src/components/admin/AgentVideoDialog.tsx`** (react-hook-form + Zod):
- Campos: `video_code`, `title`, `description`, `pilar`, `recommended_for_ins_cat`, `momento`, `youtube_url`, `obrigatorio`, `gatilho` (textarea legível), `sessoes_alvo` (multi-input), `bloco_alvo`, `exercise_id` (autocomplete dos exercícios protocol_only), `recommended_for_dor_cat`, `mandatory_at_session`, `ordem_sequencia`, `active`
- Preview do YouTube embutido quando URL preenchida
- Validação cruzada: se `pilar=resistido` e `momento=antes_exercicio` → `exercise_id` obrigatório

**Hook `src/hooks/useAgentVideos.ts`**: CRUD + filtros + função `seedFromMapping()` que invoca a edge function de re-seed.

**Sidebar**: adicionar "Vídeos do Agente" sob "Repertório" no admin (separado de "Vídeos de Apoio").

## Fase 5 — Aba "Mapa de Vídeos" no ProtocolAgentTab

Estender `src/components/admin/ProtocolAgentTab.tsx` adicionando uma 3ª aba "Mapa de Vídeos" (junto de Diretrizes e Simulador):

- **Card 1**: Tabela de atribuição I1/I2/I3 (regra "nunca sobe")
- **Card 2**: Diagrama da hierarquia de disparo (5 prioridades) com badges coloridos
- **Card 3**: Heatmap visual mostrando os ~50 vídeos agrupados por (pilar × nível), cor verde se URL configurada, amarelo se pendente
- **Card 4**: Lista resumida das condições obrigatórias por sessão (1, 6, 12, 13, 18, 24, 25, 36)
- Link "Gerenciar vídeos" que leva para `/admin/agent-videos`

Tudo somente-leitura nesta aba — gestão fica em `/admin/agent-videos`.

---

## Arquivos criados / editados

**Criados:**
- `supabase/migrations/<timestamp>_extend_agent_videos.sql` (schema + seed)
- `src/pages/admin/AgentVideos.tsx`
- `src/components/admin/AgentVideoDialog.tsx`
- `src/components/admin/AgentVideosMapTab.tsx` (Card-conteúdo da nova aba)
- `src/hooks/useAgentVideos.ts`
- `src/lib/schemas/agentVideoSchema.ts`

**Editados:**
- `src/App.tsx` — registra rota `/admin/agent-videos`
- `src/components/sidebar/AppSidebar.tsx` — item "Vídeos do Agente"
- `src/components/admin/ProtocolAgentTab.tsx` — terceira aba "Mapa de Vídeos"
- `supabase/functions/calculate-anamnesis-profile/index.ts` — aplica regra ins_cat + cria alerta
- `src/integrations/supabase/types.ts` — auto-regenerado

---

## Decisões aplicadas

- **Seed completo** dos ~50 vídeos como skeleton (sem URL). Admin só preenche YouTube depois conforme conteúdo for produzido.
- **VID-RES por exercício**: usar coluna nova `agent_videos.exercise_id` (mais flexível que `exercises.preparation_video_url`, que continua existindo para exercícios fora do protocolo).
- **`agent_videos` ≠ `support_videos`**: mantidas como tabelas distintas com finalidades diferentes (motor determinístico do protocolo vs. biblioteca aberta).
- **Consumo no fluxo de execução** (chamadas reais à RPC durante a sessão) fica para uma próxima entrega — primeiro precisamos popular as URLs.

Posso prosseguir?
