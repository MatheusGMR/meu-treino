

## Implementação dos 3 Pontos de Alta Prioridade

### 1. Permitir nomear e tipar sessões

**Arquivo:** `src/components/clients/SessionCard.tsx`

- Adicionar props `onUpdateName` e `onUpdateDescription` ao `SessionCardProps`
- No header da sessão, ao lado do nome, adicionar um botão de edição (ícone `Edit`) que abre um inline edit
- Quando `isNew`, mostrar um `Input` editável para o nome da sessão em vez de texto fixo "Sessão 1"
- Adicionar um `Select` compacto para o tipo de sessão (Musculação/Mobilidade/Alongamento) ao lado do nome

**Arquivo:** `src/components/clients/WorkoutBuilder.tsx`

- Criar handler `handleUpdateSessionName` que chama `builder.updateSession()` com o novo nome
- Passar as novas props ao `SessionCard`/`SortableSession`

**Arquivo:** `src/hooks/useClientWorkoutBuilder.ts`

- Adicionar campo `session_type` ao `TempSession` interface (já existe no schema como obrigatório)
- Garantir que o `session_type` seja enviado na submissão

### 2. Toast + auto-scroll ao adicionar exercício

**Arquivo:** `src/components/clients/SessionCard.tsx`

- Adicionar `useRef` para a div da lista de exercícios adicionados
- No `onAddExercise` callback, após adicionar:
  - Exibir toast de sucesso: "Exercício adicionado à sessão"
  - Fazer `scrollIntoView({ behavior: 'smooth' })` da lista de exercícios para que fique visível
- Atualizar o badge de contagem em tempo real (já funciona via props)

**Arquivo:** `src/components/clients/KanbanExerciseSelector.tsx`

- Sem mudanças — o `onSave` já propaga corretamente

### 3. Confirmação ao remover sessão com exercícios

**Arquivo:** `src/components/clients/SessionCard.tsx`

- Importar `AlertDialog` components
- Envolver o botão de remover com `AlertDialog`:
  - Se `session.exercises.length > 0`: mostrar dialog de confirmação com mensagem "Esta sessão contém X exercício(s). Deseja removê-la?"
  - Se a sessão estiver vazia: remover diretamente sem confirmação

**Arquivo:** `src/components/clients/WorkoutBuilder.tsx`

- Nenhuma mudança necessária — o `onRemove` já está propagado

---

### Resumo de Arquivos

| Arquivo | Alterações |
|---------|------------|
| `src/components/clients/SessionCard.tsx` | Edição inline de nome/tipo, toast+scroll ao adicionar, AlertDialog ao remover |
| `src/components/clients/WorkoutBuilder.tsx` | Handlers para atualizar nome/tipo de sessão, passar novas props |
| `src/hooks/useClientWorkoutBuilder.ts` | Adicionar `session_type` ao TempSession |

