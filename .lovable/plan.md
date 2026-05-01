## Objetivo

Substituir as duas edge functions que hoje montam sessão (`agent-build-session` para o cliente real e `simulate-protocol-session` para o admin) por **uma única função `build-session`** com parâmetro `mode: "real" | "simulation"`. Garante paridade por construção e elimina código duplicado (templates, marcos, vídeos obrigatórios — hoje só o real faz isso, o simulador agora também testará).

## Escopo

### 1. Criar `supabase/functions/build-session/index.ts`

Função única que aceita:

```ts
// Modo real (cliente autenticado monta próxima sessão)
{ mode: "real", client_id: string, session_number?: number }

// Modo simulação (admin testa cenário hipotético)
{
  mode: "simulation",
  session_number: number,
  perfil_primario, ins_cat, dor_cat, dor_local,
  tempo_cat, disposicao, nivel_experiencia,
  client_name?: string,
  client_id?: string  // opcional: simular sobre cliente real existente
}
```

Fluxo interno:
1. Auth: valida JWT. Se `mode = "simulation"`, exige role `admin`.
2. Se `simulation` e `client_id` ausente → upsert anamnese/progresso/checkin no `SIM_CLIENT_ID` fixo (lógica atual do simulador).
3. Chama RPC `select_session_exercises` (motor único — nada muda na DB).
4. Carrega marco da sessão + vídeos obrigatórios.
5. Escolhe template de comunicação e formata mensagem.
6. Se `mode = "real"`: atualiza `client_protocol_progress` (sessao_atual, bloco_atual). Se `simulation`: pula essa atualização para não poluir progresso real.
7. Retorna formato unificado: `{ success, mode, session, milestone, message, decisions, context }`. Inclui `simulation: true` quando aplicável (compat com UI atual).

### 2. Atualizar `src/components/admin/ProtocolSimulator.tsx`

Trocar `invoke("simulate-protocol-session", { body: {...} })` por `invoke("build-session", { body: { mode: "simulation", ...} })`. Resposta tem o mesmo shape, então só muda o nome da função e adiciona `mode`.

### 3. Remover funções antigas

- Deletar pasta `supabase/functions/agent-build-session/`.
- Deletar pasta `supabase/functions/simulate-protocol-session/`.
- Chamar `supabase--delete_edge_functions` com `["agent-build-session", "simulate-protocol-session"]` para remover o deploy.

## Verificações

- `agent-build-session` hoje **não tem nenhum consumidor** no código (verificado via ripgrep) → remoção é segura.
- `simulate-protocol-session` é chamada apenas em `ProtocolSimulator.tsx` linha 90 → atualização única.
- A RPC `select_session_exercises` permanece igual — nenhuma migração SQL necessária.

## Resultado

```
Antes:                          Depois:
- agent-build-session           - build-session (mode: real | simulation)
- simulate-protocol-session     - elevenlabs-conversation-token (voz, separado)
- elevenlabs-conversation-token
```

1 motor de montagem, com 2 modos de entrada, mesma RPC. Simulador passa a exercitar inclusive templates e marcos (hoje os duplica). Eventos (`record-perception-signal`, `submit-post-session-feedback`, `analyze-*`) continuam separados por terem propósitos diferentes.
