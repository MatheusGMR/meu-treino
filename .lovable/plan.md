

## Ajustes Finos no Construtor de Treino

### Problema 1: Footer não está fixo

Atualmente, o layout está assim:
```text
┌─────────────────────────────────────────────────────────────┐
│ Header (fixo)                                               │
├─────────────────────────────────────────────────────────────┤
│ [Sessões (scroll)]              │  [Cockpit (scroll)]       │
│                                 │                           │
│                                 │                           │
├─────────────────────────────────────────────────────────────┤
│ Footer (Cancelar | Atribuir) ← também faz scroll            │
└─────────────────────────────────────────────────────────────┘
```

O footer com os botões "Cancelar" e "Atribuir Treino" está dentro do fluxo de scroll. Precisa ficar **fixo na parte inferior**.

**Arquivo:** `src/components/clients/WorkoutBuilder.tsx`

**Solução:**
1. Alterar a estrutura do componente para usar `flex flex-col h-full`
2. O header permanece no topo
3. A área central (`flex gap-6`) recebe `flex-1 min-h-0 overflow-hidden`
4. O footer recebe `flex-shrink-0` para permanecer fixo

```text
┌─────────────────────────────────────────────────────────────┐
│ Header (fixo, flex-shrink-0)                                │
├─────────────────────────────────────────────────────────────┤
│ [Sessões (scroll)]              │  [Cockpit (scroll)]       │
│   overflow-y-auto               │    overflow-y-auto        │
│   flex-1, min-h-0               │    flex-1, min-h-0        │
├─────────────────────────────────────────────────────────────┤
│ Footer (FIXO, flex-shrink-0)                                │
└─────────────────────────────────────────────────────────────┘
```

---

### Problema 2: Título "Grupo Muscular" muito grande

No `KanbanExerciseSelector.tsx`, linha 350-351:
```html
<h4 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-3 leading-tight">
  Grupo Muscular
</h4>
```

O título "Grupo Muscular" (13 caracteres) é maior que os outros:
- "Tipo" (4 caracteres)
- "Exercício" (9 caracteres)  
- "Volume" (6 caracteres)
- "Método" (6 caracteres)

Isso causa desalinhamento nos botões abaixo.

**Arquivo:** `src/components/clients/KanbanExerciseSelector.tsx`

**Solução:**
Encurtar "Grupo Muscular" para apenas **"Grupo"** (5 caracteres), mantendo consistência com os outros títulos.

---

## Alterações Detalhadas

### Arquivo 1: `src/components/clients/WorkoutBuilder.tsx`

**Linha 236**: Alterar container principal
```typescript
// De:
<div className="space-y-6">

// Para:
<div className="flex flex-col h-full">
```

**Linha 238**: Header com flex-shrink-0
```typescript
// De:
<div className="flex items-center gap-4 pb-4 border-b">

// Para:
<div className="flex items-center gap-4 pb-4 border-b flex-shrink-0">
```

**Linha 251**: Área central com flex-1 e overflow controlado
```typescript
// De:
<div className="flex gap-6 h-[calc(100vh-280px)]">

// Para:
<div className="flex gap-6 flex-1 min-h-0 overflow-hidden mt-6">
```

**Linha 443**: Footer fixo
```typescript
// De:
<div className="flex justify-end gap-3 pt-6 border-t">

// Para:
<div className="flex justify-end gap-3 pt-6 border-t flex-shrink-0 mt-6">
```

---

### Arquivo 2: `src/components/clients/KanbanExerciseSelector.tsx`

**Linha 350-352**: Encurtar título da coluna
```typescript
// De:
<h4 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-3 leading-tight">
  Grupo Muscular
</h4>

// Para:
<h4 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-3 leading-tight">
  Grupo
</h4>
```

---

## Resultado Esperado

### Layout Corrigido
```text
┌─────────────────────────────────────────────────────────────┐
│ ← Construtor de Treino                      (Header FIXO)   │
│   Monte um treino personalizado...                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Sessões do Treino]              [Perfil do Cliente]       │
│  ┌──────────────────┐             ┌──────────────────┐      │
│  │ ↕ scroll interno │             │ ↕ scroll interno │      │
│  │                  │             │                  │      │
│  └──────────────────┘             └──────────────────┘      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                           [Cancelar]  [Atribuir]  (FIXO)    │
└─────────────────────────────────────────────────────────────┘
```

### Colunas Kanban Alinhadas
```text
┌────────┬────────┬───────────┬────────┬────────┐
│  Tipo  │ Grupo  │ Exercício │ Volume │ Método │  ← Títulos alinhados
├────────┼────────┼───────────┼────────┼────────┤
│  [  ]  │  [  ]  │   [  ]    │  [  ]  │  [  ]  │  ← Botões alinhados
│  [  ]  │  [  ]  │   [  ]    │  [  ]  │  [  ]  │
└────────┴────────┴───────────┴────────┴────────┘
```

---

## Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/components/clients/WorkoutBuilder.tsx` | Reestruturar layout com flex para footer fixo |
| `src/components/clients/KanbanExerciseSelector.tsx` | Encurtar "Grupo Muscular" → "Grupo" |

