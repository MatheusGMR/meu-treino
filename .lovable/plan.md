

## Exercícios em Ordem Alfabética com Indicador de Vídeo

### Objetivo
1. Ordenar os exercícios alfabeticamente na coluna "Exercício" do Kanban
2. Adicionar um pequeno ícone indicando se o exercício possui vídeo disponível

---

### Análise Atual

**Arquivo:** `src/components/clients/KanbanExerciseSelector.tsx`

A lista de exercícios é gerada pelo `availableExercises` (linhas 99-105):
```typescript
const availableExercises = useMemo(() => {
  if (!selectedType || !selectedGroup || !allExercises) return [];
  return allExercises.filter(ex => 
    ex.exercise_type === selectedType && 
    ex.exercise_group === selectedGroup
  );
}, [selectedType, selectedGroup, allExercises]);
```

Atualmente **não há ordenação alfabética** - os exercícios são exibidos na ordem que vêm do banco.

O campo `video_url` existe na tabela `exercises` e pode ser `string | null`.

---

### Solução Proposta

#### 1. Ordenação Alfabética

Adicionar `.sort()` ao `availableExercises`:
```typescript
const availableExercises = useMemo(() => {
  if (!selectedType || !selectedGroup || !allExercises) return [];
  return allExercises
    .filter(ex => 
      ex.exercise_type === selectedType && 
      ex.exercise_group === selectedGroup
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')); // Ordem alfabética
}, [selectedType, selectedGroup, allExercises]);
```

Também ordenar os resultados de busca (linha 111-118):
```typescript
const searchResults = useMemo(() => {
  if (!searchQuery.trim() || !allExercises) return null;
  const query = searchQuery.toLowerCase();
  
  return allExercises
    .filter(ex => ...)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')) // Ordenar
    .slice(0, 8);
}, [searchQuery, allExercises]);
```

#### 2. Indicador de Vídeo no SelectionCard

**Arquivo:** `src/components/clients/SelectionCard.tsx`

Adicionar nova prop `hasVideo`:
```typescript
interface SelectionCardProps {
  // ... props existentes
  hasVideo?: boolean;
}
```

Exibir ícone de vídeo discreto junto ao título:
```typescript
import { Video } from "lucide-react";

// No JSX:
<div className="flex items-center gap-1">
  <div className="font-medium text-sm leading-tight break-words">{title}</div>
  {hasVideo && (
    <Video className="w-3 h-3 text-muted-foreground shrink-0" />
  )}
</div>
```

#### 3. Passar `hasVideo` no KanbanExerciseSelector

**Arquivo:** `src/components/clients/KanbanExerciseSelector.tsx`

Ao renderizar o `SelectionCard` de exercícios (linhas 416-433):
```typescript
<SelectionCard
  key={ex.id}
  title={ex.name}
  subtitle={ex.level || undefined}
  isSelected={selectedExercise === ex.id}
  onClick={() => handleExerciseSelect(ex.id)}
  onPreview={() => {...}}
  hasVideo={!!ex.video_url}  // ← Novo
  hasWarning={...}
  warningMessage={...}
  warningSeverity={...}
/>
```

---

### Resultado Visual

```text
┌─────────────────────────────────────┐
│ Exercício                           │
├─────────────────────────────────────┤
│ [Agachamento Búlgaro] 🎬            │  ← Com vídeo
│ [Agachamento Livre]                 │  ← Sem vídeo
│ [Afundo]                            │  ← Sem vídeo
│ [Leg Press 45°] 🎬                  │  ← Com vídeo
│ [Stiff] 🎬                          │  ← Com vídeo
└─────────────────────────────────────┘
          ↑ Ordem alfabética
```

O ícone será pequeno (12x12px) e discreto, na cor `muted-foreground`, posicionado logo após o nome.

---

### Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/components/clients/KanbanExerciseSelector.tsx` | Ordenar exercícios alfabeticamente + passar `hasVideo` |
| `src/components/clients/SelectionCard.tsx` | Adicionar prop `hasVideo` e exibir ícone |

