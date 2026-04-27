## Objetivo

Substituir o diálogo atual de cadastro de exercício do Protocolo (`ProtocolExerciseDialog`) por um **wizard em 6 passos** que segue exatamente o fluxo do protótipo enviado, mantendo a base de dados e a modelagem determinística (PAI/SUB, regiões de dor, treino A/B, bloco do protocolo) já implementadas nas Fases 1-5.

O wizard será renderizado dentro do mesmo `Dialog` existente, acessível pelo botão **"Novo exercício"** em `/admin/protocol-bank` e pelo lápis de edição de cada item.

## Fluxo do wizard (6 passos)

```text
1. Nome      → texto livre (mín. 3 chars, máx. 100)
2. Bloco     → MOB · FORT · MS · MI · CARD · ALONG
3. Equipam.  → opções filtradas por bloco; segurança S1-S5 derivada automaticamente
4. Nível     → BI · BII · BIII · IN1 · IN2 · IN3  (grava em difficulty_code)
5. Detalhes  → Grupo muscular, Vetor de movimento + campos PAI/SUB do protocolo
6. Confirmar → preview do ID JMP gerado + resumo + salvar
```

Stepper no topo com números, check (✓) quando concluído e cliques retroativos permitidos. Botões "Voltar" e "Próximo" no rodapé. Tela de sucesso com o ID destacado e ações ("+ Cadastrar outro" / "Ver biblioteca").

## Mapeamento Bloco × Equipamento × Segurança

Vai para um arquivo de constantes reutilizável `src/lib/protocol/exerciseTaxonomy.ts`:

- **MOB / FORT / ALONG** → `PC`, `ELAS`, `BAR` (este só MOB) → S1
- **MS / MI** → `MAC` (S1) · `DIV` (S2) · `CONV` (S2) · `CAB` (S4) · `BAR` (S3) · `HAL` (S5) · `PC` (S1)
- **CARD** → `MAC` (equipamento aeróbio) → S1

Cada equipamento tem `nome`, `seg`, `desc` (texto explicativo curto) e cores derivadas dos tokens semânticos do design system (não hardcode roxo do protótipo — adaptar para Crimson #DC143C sobre dark do projeto).

## Vetores de movimento (novo campo `movement_vector`)

Lista agrupada (Padrões MMSS, MMII, Capacidades Articulares, Mobilidade, Fortalecimento, Alongamento, Cardio) — total ~30 opções. Salvo em **uma nova coluna texto `movement_vector`** em `exercises` (códigos: `EMP-F`, `EMP-I`, `REM`, `PUX-C`, `LEV`, `EC-JOE`, `CA-JOE-E`, etc.). Reutiliza coluna existente `movement` apenas se for sinônimo — vou usar coluna nova para não quebrar dados pré-existentes.

## Geração do ID JMP

Formato: `{BLOCO}{EQUIP}{SEG}{NIVEL}{NNN}` — ex.: `MSMACS1BI073`.

- O sufixo numérico de 3 dígitos é o próximo livre na combinação (não aleatório como no protótipo). Implementado por uma função RPC simples `next_protocol_exercise_seq(_block, _equip, _safety, _level)` que faz `MAX(...)+1`.
- Salvo em `external_id`. Se o usuário quiser sobrescrever manualmente, abre um campo editável no passo Confirmar.

## Campos do protocolo PAI/SUB integrados

Os campos da modelagem JMP (já existentes nas Fases 1-3) entram em **etapas dedicadas dentro do passo 5 (Detalhes)** para não fragmentar:

- **Tipo (PAI/SUB)** — chip toggle
- **PAI vinculado** (apenas quando SUB) — select com PAIs do mesmo `bloco_protocolo`
- **Região de dor** — L0, L1, L2, L3, L_MULTI (chips)
- **Treino A / B / Ambos** — chip
- **Bloco do protocolo** (1-4) — number input
- **É primário?** / **Base fixa?** — toggles com tooltip
- **Vídeo YouTube Shorts** — input URL

Tooltips obrigatórios em cada campo técnico (regra `interactive-help-standard`).

## Banco de dados

Apenas **uma migration** necessária:

1. Adicionar coluna `movement_vector text` em `exercises`
2. Criar função `next_protocol_exercise_seq(_block, _equip, _safety, _level)` retornando o próximo nº disponível como texto zero-padded (ex.: `'073'`)

Nenhuma mudança nos enums — todos já existem.

## Arquivos a criar / editar

**Novos**
- `src/lib/protocol/exerciseTaxonomy.ts` — constantes BLOCOS, EQUIP_MAP, SEG_MAP, NIVEIS, VETORES
- `src/components/admin/protocol-wizard/ProtocolExerciseWizard.tsx` — orquestrador de steps
- `src/components/admin/protocol-wizard/StepNome.tsx`
- `src/components/admin/protocol-wizard/StepBloco.tsx`
- `src/components/admin/protocol-wizard/StepEquipamento.tsx`
- `src/components/admin/protocol-wizard/StepNivel.tsx`
- `src/components/admin/protocol-wizard/StepDetalhes.tsx`
- `src/components/admin/protocol-wizard/StepConfirmar.tsx`
- `src/components/admin/protocol-wizard/WizardStepper.tsx`

**Editados**
- `src/components/admin/ProtocolExerciseDialog.tsx` → passa a renderizar o wizard
- `src/hooks/useProtocolBank.ts` → adicionar `equipment_code`, `difficulty_code`, `movement_vector` nos selects e mutations
- `src/integrations/supabase/types.ts` (auto-gerado após migration)

**Migration**
- `supabase/migrations/<ts>_protocol_wizard_support.sql`

## Estilo visual

Adaptar a paleta roxa do protótipo para o **Crimson Red (#DC143C) sobre fundo dark** já estabelecido no projeto (usando tokens `--primary`, `--card`, `--background`, etc. do `index.css`). Mesmas mecânicas de stepper, chips e cards de resumo, apenas reskinned.

## Saída final

Após salvar, o wizard chama `useUpsertProtocolExercise` (já existente), invalida a query do Banco e mostra a tela de sucesso com o ID gerado e dois CTAs.
