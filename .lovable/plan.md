
# Reestruturação do funil de entrada

## Visão geral do novo fluxo

```text
1. /protocolo-destravamento (landing)
2. /client/eligibility           → mantém como está
3. /client/eligibility/approved  → NOVA tela de aprovação/comemoração
4. /client/onboarding            → NOVA mini-anamnese "Conhecendo Você" (8 perguntas)
5. /client/onboarding/summary    → NOVA tela com resumo do agente + plano do protocolo
6. /client/checkout              → mantém (com botão DEV de pular)
7. /client/checkout-success      → mantém
8. /client/dashboard             → app, com popup de check-in estruturado (sem áudio)
```

A anamnese completa (`/client/anamnesis`) **deixa de ser obrigatória nessa entrada**. As 8 respostas do "Conhecendo Você" já gravam o registro inicial em `anamnesis` para alimentar o agente/RPC. A anamnese completa fica disponível para preenchimento posterior (perfil/configurações), sem repetir as perguntas já respondidas.

---

## 1. Tela de aprovação pós-elegibilidade

**Novo arquivo**: `src/pages/client/EligibilityApproved.tsx`
**Rota**: `/client/eligibility/approved`

- Animação de comemoração (checkmark + confete leve via framer-motion)
- Título: "Você foi aprovada! 🎉"
- Subtítulo: "Agora vamos te conhecer um pouco melhor para personalizar seu protocolo."
- CTA único: "Continuar" → `/client/onboarding`

**Edição em `EligibilityForm.tsx`**: ao final do `handleSubmit`, redirecionar para `/client/eligibility/approved` em vez de `/client/checkout`.

---

## 2. Mini-anamnese "Conhecendo Você"

**Novo arquivo**: `src/pages/client/ClientOnboarding.tsx`
**Rota**: `/client/onboarding`

Estrutura em 3 blocos visuais (typeform-style, 1 pergunta por tela, igual padrão atual):

**Bloco A — Conhecendo você**
1. Você já treina ou está começando agora? (`treina_atualmente` + `nivel_experiencia`)
   - "Nunca treinei" → `iniciante`, `treina_atualmente=false`
   - "Já treinei mas parei" → `intermediario`, `treina_atualmente=false`
   - "Treino atualmente" → `intermediario`, `treina_atualmente=true`
2. Você se sente segura treinando sozinha? (`ins_cat`)
   - Sim → `I1` · Mais ou menos → `I2` · Não → `I3`

**Bloco B — Seu corpo fala**
3. Sente alguma dor ou desconforto hoje? (`has_joint_pain`: Não/Sim)
4. *(condicional se Sim)* Onde você sente? múltipla seleção → `pain_locations` (Lombar, Joelho, Ombro, Quadril, Outro). Já mescla com dores marcadas na elegibilidade (ombro/lombar/joelho), evitando redundância.
5. *(condicional se Sim)* Essa dor limita seus movimentos? → `escala_dor` (Não=2, Pouco=5, Bastante=8) e `dor_cat` (D1/D2/D3)

**Bloco C — Quase lá**
6. Como está seu tempo hoje? (`tempo_disponivel`)
   - 20–30 / 30–45 / 45–60 → também grava `tempo_cat` (T1/T2/T3) usado pelo RPC
7. O que você mais busca agora? (`primary_goal`)
   - Saúde e bem-estar / Reduzir dores / Melhorar o corpo / Ganhar força

**Submit**: insere registro em `anamnesis` com os campos preenchidos + dados da elegibilidade (idade, gênero, contato, nome). Marca `anamnesis_completed = false` (é parcial), mas grava `anamnesis_partial = true` (campo novo) ou usa flag em `sessionStorage` para o resumo. Chama `calculate-anamnesis-profile` para o agente já gerar perfil/recomendações.

---

## 3. Tela de resumo + plano

**Novo arquivo**: `src/pages/client/OnboardingSummary.tsx`
**Rota**: `/client/onboarding/summary`

Mostra ao usuário o que o agente captou + plano do Protocolo Destravamento:

- "Aqui está o que entendi sobre você 🤝"
  - Cards com: nível de experiência, segurança (I1/I2/I3), dores principais, tempo disponível, objetivo principal
  - Texto curto gerado: "Vamos começar com sessões de X min focadas em Y…"
- Bloco "Seu plano: Protocolo Destravamento"
  - Duração estimada, frequência sugerida, blocos (Mobilidade → Fortalecimento → Resistido → Alongamento)
  - Vindo de `anamnesis_profile`/`profileDetails` (já existe)
- CTA: "Liberar meu protocolo →" `/client/checkout`

---

## 4. Ajuste do checkout

`ProtocoloCheckout.tsx`:
- Botão DEV **pula** para `/client/dashboard` em vez de `/client/anamnesis` (anamnese completa não é mais obrigatória).
- `CheckoutSuccess.tsx`: mesmo redirecionamento → `/client/dashboard`.
- `EligibilityForm.tsx`: o `handleSubmit` final redireciona para `/client/eligibility/approved` (não pula direto pro checkout).

---

## 5. Popup de check-in no app (sem áudio, sem duplicação)

`ClientDashboard.tsx`: trocar `DailyCheckinDialog` (áudio) por `StructuredCheckinDialog` (já existe e é estruturado, sem áudio).

Ajustes em `StructuredCheckinDialog.tsx` para casar com o texto pedido:
- Cabeçalho: "Vamos entender como você está hoje?" + sub: "Responda rapidinho para eu ajustar seu treino do melhor jeito para você. ♡"
- Pergunta 1 (sono/disposição contextual) — já existe via `getDisposicaoPreset` → manter
- Pergunta 2 (dor) — só pergunta se a anamnese registra dor (já faz). Texto: "E [região], está doendo hoje?" usando `pain_locations` da anamnese para preencher `[região]` (corrige o "undefined" atual).
- Pergunta 3 (tempo) — manter
- Rodapé: "Sua segurança vem sempre primeiro. Suas respostas são confidenciais e usadas apenas para ajustar seu treino."

**Anti-duplicação**: as perguntas do "Conhecendo Você" (nível, segurança, objetivo, locais de dor base) **não aparecem** no check-in diário. O check-in só coleta variação do dia (sono/disposição, dor pontual, tempo), que são inputs do `select_session_exercises` (`tempo_cat`, `dor_cat_dia`, `disposicao`).

Remover `DailyCheckinDialog` do `ClientDashboard` (manter o arquivo por ora, mas sem uso, para evitar quebras se referenciado em outro lugar — verificar antes).

---

## 6. Roteamento (App.tsx)

Adicionar:
```tsx
<Route path="/client/eligibility/approved" element={<AuthGuard><RoleGuard allowedRoles={["client"]}><EligibilityApproved /></RoleGuard></AuthGuard>} />
<Route path="/client/onboarding" element={<AuthGuard><RoleGuard allowedRoles={["client"]}><ClientOnboarding /></RoleGuard></AuthGuard>} />
<Route path="/client/onboarding/summary" element={<AuthGuard><RoleGuard allowedRoles={["client"]}><OnboardingSummary /></RoleGuard></AuthGuard>} />
```

Manter `/client/anamnesis` (anamnese completa) acessível via perfil para enriquecimento posterior.

---

## Detalhes técnicos

- **Persistência**: `ClientOnboarding` faz `insert` em `anamnesis` apenas com os campos preenchidos. Como existem triggers (`sync_medical_conditions_from_anamnesis`, `normalize_nivel_experiencia`), os campos derivados se preenchem sozinhos. `anamnesis_completed` fica `false` até a anamnese completa.
- **Mapeamentos importantes**:
  - "Sente dor + limita bastante" → `dor_cat='D3'`, `escala_dor=8`
  - "Tempo 20–30" → `tempo_cat='T1'`, `tempo_disponivel='30 minutos'`
  - "Segurança Não" → `ins_cat='I3'` (já dispara regras do agente)
- **Resumo**: chamar `calculate-anamnesis-profile` ao final do onboarding e ler `anamnesis_profile` + `anamnesis_profiles.recommendations` para montar a tela de resumo.
- **Check-in**: corrigir bug do `[região] undefined` lendo `anamnesis.pain_locations[0]` ou listando todas.

## Arquivos afetados

Novos:
- `src/pages/client/EligibilityApproved.tsx`
- `src/pages/client/ClientOnboarding.tsx`
- `src/pages/client/OnboardingSummary.tsx`

Editados:
- `src/App.tsx` (3 rotas novas)
- `src/pages/client/EligibilityForm.tsx` (redirect final)
- `src/pages/client/ProtocoloCheckout.tsx` (skip e success → dashboard)
- `src/pages/client/CheckoutSuccess.tsx` (redirect → dashboard)
- `src/pages/client/ClientDashboard.tsx` (trocar DailyCheckinDialog por StructuredCheckinDialog)
- `src/components/client/StructuredCheckinDialog.tsx` (textos, região dinâmica, cabeçalho/rodapé)

Sem alterações de schema (todos os campos usados já existem em `anamnesis`).
