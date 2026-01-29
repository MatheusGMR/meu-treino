

## Objetivo
Simplificar a experiência do seletor de exercícios Kanban, removendo o conflito entre hover e redimensionamento, mantendo colunas com tamanho fixo, e adicionando uma barra de busca para facilitar a localização de exercícios.

---

## Problemas Identificados

1. **Conflito hover vs. seleção**: A função `getColumnFlexClass` altera o tamanho das colunas tanto no hover (`hoverColumnIndex`) quanto na seleção (`activeColumnIndex`), causando redimensionamentos confusos e inesperados.

2. **Expansão excessiva**: Quando o mouse passa sobre uma coluna, ela expande para `flex-[3]`, o que causa "saltos" visuais e conflita com a rolagem horizontal.

3. **Ausência de busca**: Não existe forma de filtrar exercícios por nome, forçando o usuário a navegar por todas as opções manualmente.

---

## Solução Proposta

### Parte A - Remover comportamento de hover que altera tamanho

**Arquivo:** `src/components/clients/KanbanExerciseSelector.tsx`

1. **Remover `hoverColumnIndex`**: Eliminar completamente o estado e eventos `onMouseEnter`/`onMouseLeave` das colunas.

2. **Simplificar `getColumnFlexClass`**: A função passará a depender apenas de `activeColumnIndex`, sem considerar hover.

3. **Colunas com largura fixa**: Trocar o sistema de `flex-[0.5]/[1]/[3]` por larguras fixas com `shrink-0`:
   - Colunas anteriores à ativa: `w-[100px]` (compactas)
   - Coluna ativa: `w-[220px]` (expandida)
   - Colunas posteriores: `w-[140px]` (padrão)
   
   Isso torna o layout **previsível** e elimina saltos visuais.

4. **Manter auto-scroll**: O `scrollIntoView` continua funcionando para trazer a coluna ativa para a área visível quando a seleção avança.

---

### Parte B - Adicionar barra de busca para exercícios

**Arquivo:** `src/components/clients/KanbanExerciseSelector.tsx`

1. **Novo estado**: `const [searchQuery, setSearchQuery] = useState<string>("")`

2. **Input de busca**: Adicionar um campo de input acima do grid de colunas:
   ```text
   [🔍 Buscar exercício, grupo ou tipo...]
   ```

3. **Lógica de filtro inteligente**:
   - Se a busca corresponder a um **tipo** (ex: "musculação"), selecionar automaticamente.
   - Se corresponder a um **grupo muscular** (ex: "peito"), selecionar tipo + grupo.
   - Se corresponder a um **nome de exercício**, filtrar a lista de exercícios disponíveis.

4. **Comportamento**:
   - A busca é **opcional** - o fluxo de colunas continua funcionando normalmente.
   - Ao digitar, resultados aparecem como dropdown ou filtram a coluna de exercícios.
   - Ao selecionar um resultado da busca, o sistema preenche automaticamente tipo/grupo e posiciona na coluna de exercício.

---

### Parte C - Ajustes visuais complementares

**Arquivo:** `src/components/clients/KanbanExerciseSelector.tsx`

1. **Reduzir altura das colunas**: De `h-[280px]...h-[400px]` para `h-[250px]...h-[350px]` para melhor encaixe.

2. **Indicador visual de foco**: Adicionar borda sutil ou sombra na coluna ativa para destacá-la sem depender de tamanho.

3. **Animação suave**: Manter `transition-all duration-300` apenas para scroll, não para redimensionamento.

---

## Resultado Esperado

```text
Antes (confuso):
┌──────────────────────────────────────────────────────────────┐
│ [Tipo]──[Grupo]─────────────────────[Exercício][Volume][Método]
│   ↓        ↓ (expande no hover!)        ↓         ↓       ↓
│  Saltos visuais constantes ao mover o mouse
└──────────────────────────────────────────────────────────────┘

Depois (estável):
┌──────────────────────────────────────────────────────────────┐
│ [🔍 Buscar exercício...]                                      │
├──────────────────────────────────────────────────────────────┤
│ [✓Tipo][✓Grupo][Exercício*      ][Volume    ][Método    ]    │
│   100px  100px    220px (ativo)   140px       140px          │
│         ← scroll automático para coluna ativa →              │
└──────────────────────────────────────────────────────────────┘
* Ao selecionar, avança para próxima coluna suavemente
```

---

## Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/components/clients/KanbanExerciseSelector.tsx` | Remover hover, larguras fixas, adicionar busca |

---

## Detalhes Técnicos

### Nova função de dimensionamento (sem hover)
```typescript
const getColumnWidthClass = (columnIndex: number) => {
  if (columnIndex < activeColumnIndex) return "w-[100px] shrink-0";
  if (columnIndex === activeColumnIndex) return "w-[220px] shrink-0";
  return "w-[140px] shrink-0";
};
```

### Estrutura do input de busca
```typescript
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
  <Input
    placeholder="Buscar exercício, grupo ou tipo..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="pl-9"
  />
</div>
```

### Filtro inteligente
```typescript
const filteredExercises = useMemo(() => {
  if (!searchQuery.trim() || !allExercises) return availableExercises;
  const query = searchQuery.toLowerCase();
  return allExercises.filter(ex => 
    ex.name.toLowerCase().includes(query) ||
    ex.exercise_group.toLowerCase().includes(query) ||
    ex.exercise_type.toLowerCase().includes(query)
  );
}, [searchQuery, allExercises, availableExercises]);
```

---

## Critérios de Aceite

1. Mover o mouse sobre as colunas **não altera** o tamanho delas.
2. Selecionar uma opção avança para a próxima coluna com scroll suave.
3. A barra de busca filtra exercícios por nome, grupo ou tipo.
4. O layout permanece estável e previsível durante toda a interação.
5. Todas as 5 colunas continuam acessíveis via scroll horizontal.

