

## Metodo Padrao por Sessao com Auto-Preenchimento

### Conceito

O profissional seleciona um **metodo padrao** ao criar/expandir uma sessao. Esse metodo pre-preenche automaticamente a coluna "Metodo" (e sugere volumes compativeis) no Kanban para cada exercicio adicionado. O fluxo Kanban passa de 5 passos para efetivamente 3 (Tipo → Grupo → Exercicio), acelerando a montagem.

O metodo pode ser alterado por exercicio individual no Kanban (a coluna continua editavel).

---

### Fluxo Proposto

```text
SessionCard Header:
┌──────────────────────────────────────────────────────────────┐
│ [≡] [▼] [Nome da Sessao______] [Tipo: Musculacao ▼]         │
│                                                              │
│ Metodo padrao: [Selecionar metodo... ▼]  ← NOVO              │
│   "3/12 - Hipertrofia • Baixo risco • Pausa 60s"            │
│                                                              │
│ Volume padrao: [Selecionar volume... ▼]  ← NOVO              │
│   "3x12 • Hipertrofia"                                      │
├──────────────────────────────────────────────────────────────┤
│ Kanban: Tipo → Grupo → Exercicio → [Volume*] → [Metodo*]    │
│                                      ↑ pre-preenchido        │
│                                      (editavel por exercicio)│
└──────────────────────────────────────────────────────────────┘
```

Quando o metodo padrao esta definido:
- A coluna "Volume" mostra o volume padrao ja selecionado mas permite trocar
- A coluna "Metodo" mostra o metodo padrao ja selecionado mas permite trocar
- O Kanban avanca automaticamente ate a coluna de exercicio (pula Volume e Metodo se ja preenchidos)
- Ao completar a selecao do exercicio, o sistema ja tem tudo para adicionar

---

### Alteracoes por Arquivo

#### 1. `src/components/clients/SessionCard.tsx`

- Adicionar dois `Select` no header da sessao (abaixo do nome/tipo):
  - **Metodo padrao**: lista todos os metodos disponiveis, mostra nome + objetivo + reps
  - **Volume padrao**: lista todos os volumes, mostra nome + series x exercicios
- Armazenar `defaultMethodId` e `defaultVolumeId` como estado local
- Passar esses valores ao `KanbanExerciseSelector` via novas props
- Exibir um resumo descritivo do metodo selecionado (reps, pausa, cadencia, carga)

#### 2. `src/components/clients/KanbanExerciseSelector.tsx`

- Novas props: `defaultMethodId?: string`, `defaultVolumeId?: string`
- Quando `defaultMethodId` existe:
  - Iniciar `selectedMethod` com esse valor
  - Iniciar `selectedVolume` com `defaultVolumeId` (se fornecido)
  - Se ambos estao preenchidos, o `activeColumnIndex` inicial e 0 (Tipo) normalmente, mas ao selecionar exercicio, pular diretamente para confirmacao
- Ajustar `handleExerciseSelect`: se defaults existem, setar volume/metodo automaticamente e marcar como completo
- A coluna Metodo e Volume continuam editaveis - o trainer clica para expandir e trocar se quiser
- Ao clicar "Adicionar Outro Exercicio", manter os defaults (nao resetar volume/metodo)

#### 3. `src/hooks/useClientWorkoutBuilder.ts`

- Sem mudancas no hook principal - os defaults sao gerenciados no nivel do SessionCard/Kanban

---

### Detalhes do Select de Metodo no SessionCard

O select mostrara cada metodo com informacoes uteis:

```text
┌─────────────────────────────────────────┐
│ Drop Set                                │
│   Hipertrofia • 8-12 reps • Pausa 60s  │
├─────────────────────────────────────────┤
│ Piramide Crescente                      │
│   Forca • 6-10 reps • Pausa 90s        │
├─────────────────────────────────────────┤
│ Bi-Set                                  │
│   Hipertrofia • 10-15 reps • Pausa 45s │
└─────────────────────────────────────────┘
```

Apos selecionar, exibe um card resumo:
```text
Metodo: Drop Set
  Reps: 8-12 | Pausa: 60s | Carga: Alta
  Cadencia: 2-1-3 | Risco: Medio | Energia: Alta
```

---

### Comportamento Inteligente do Kanban com Defaults

1. **Sem defaults**: Fluxo atual (Tipo → Grupo → Exercicio → Volume → Metodo)
2. **Com metodo + volume padrao**: Ao selecionar exercicio, sistema auto-preenche e mostra botao "Adicionar" imediatamente. Colunas Volume e Metodo mostram o valor default com indicador visual "padrao" e botao para editar
3. **Resetar defaults**: Botao "Limpar padrao" no SessionCard para voltar ao fluxo manual

---

### Arquivos a Modificar

| Arquivo | Alteracoes |
|---------|------------|
| `src/components/clients/SessionCard.tsx` | Adicionar selects de metodo/volume padrao no header, passar props ao Kanban |
| `src/components/clients/KanbanExerciseSelector.tsx` | Receber defaults, auto-preencher, pular colunas, manter editavel |

