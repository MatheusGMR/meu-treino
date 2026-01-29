

# Plano: Sidebar Colapsável + Layout Fixo do Construtor de Treino

## Contexto e Diagnóstico

### Situação Atual
1. **Sidebar**: Fixa em 256px (`w-64`), sem opção de colapsar
2. **WorkoutBuilder**: Usa `ResizablePanelGroup` permitindo redimensionar construtor x cockpit
3. **KanbanExerciseSelector**: A coluna de Método existe no código (linhas 363-403), mas pode estar sendo cortada por problema de layout
4. **Overflow**: Já existe `overflow-x-auto` no SessionCard, mas com `min-w-[800px]` que pode não ser suficiente

### Solução Proposta
- Remover os painéis redimensionáveis do WorkoutBuilder
- Tornar a sidebar colapsável (de 256px para ~64px ícones)
- Garantir que o Kanban caiba inteiro dentro do card da sessão

---

## Fase 1: Tornar a Sidebar Colapsável

### Arquivo: `src/layouts/AppLayout.tsx`

Modificar para usar estado de sidebar colapsada:

```text
┌────────────────────────────────────────────────────────────────┐
│   ANTES                          DEPOIS                       │
│                                                                │
│ ┌──────────┬──────────────┐     ┌────┬─────────────────────┐   │
│ │ Sidebar  │              │     │ ≡  │                     │   │
│ │ 256px    │   Conteúdo   │ --> │64px│      Conteúdo       │   │
│ │ FIXA     │              │     │icon│      MAIS LARGO     │   │
│ └──────────┴──────────────┘     └────┴─────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

**Alterações:**
- Criar estado `collapsed` no AppLayout
- Passar para sidebar via contexto ou prop
- Sidebar usa `w-64` quando expandida, `w-16` quando colapsada
- Botão de toggle visível no header da sidebar

### Arquivo: `src/components/sidebar/AppSidebar.tsx`

**Alterações:**
- Receber prop `collapsed` e `onToggle`
- Quando colapsado: esconder texto, mostrar só ícones
- Adicionar botão de toggle (ícone `<<` ou `>>`)
- Tooltips nos ícones quando colapsado

---

## Fase 2: Layout Fixo no WorkoutBuilder

### Arquivo: `src/components/clients/WorkoutBuilder.tsx`

**Remover:**
- `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`

**Adicionar:**
- Layout flex com tamanhos fixos:
  - Sessões: `flex-1` (ocupa espaço restante)
  - Cockpit: `w-[380px]` fixo (bom para visualização)

```typescript
// ANTES (linhas 254-450)
<ResizablePanelGroup direction="horizontal" className="gap-6">
  <ResizablePanel defaultSize={70}> ... </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={30}> ... </ResizablePanel>
</ResizablePanelGroup>

// DEPOIS
<div className="flex gap-6 h-[calc(100vh-280px)]">
  <div className="flex-1 overflow-y-auto">
    {/* Sessões do Treino */}
  </div>
  <div className="w-[380px] flex-shrink-0 overflow-y-auto">
    {/* Cockpit */}
  </div>
</div>
```

---

## Fase 3: Corrigir Layout do Kanban (Todas as Colunas Visíveis)

### Arquivo: `src/components/clients/SessionCard.tsx`

O problema é que `min-w-[800px]` pode não ser suficiente para 5 colunas com `min-w-[140px]` cada (= 700px) + gaps.

**Correção:**
```typescript
// Antes (linhas 187-196)
<div className="overflow-x-auto -mx-6 px-6">
  <div className="min-w-[800px]">
    <KanbanExerciseSelector ... />
  </div>
</div>

// Depois - Garantir espaço para todas as 5 colunas
<div className="overflow-x-auto -mx-6 px-6 pb-2">
  <div className="min-w-[900px]">
    <KanbanExerciseSelector ... />
  </div>
</div>
```

### Arquivo: `src/components/clients/KanbanExerciseSelector.tsx`

A coluna de Método EXISTE no código (linhas 363-403). Se não está aparecendo, verificar:

1. **Gap entre colunas**: `gap-4 lg:gap-6` pode estar consumindo muito espaço
2. **Altura do container**: `h-[300px] md:h-[350px] lg:h-[400px]` pode estar causando corte vertical

**Ajustes:**
- Reduzir `min-w-[140px]` para `min-w-[120px]` em telas menores
- Garantir que `gap-4` seja consistente

---

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/layouts/AppLayout.tsx` | Estado collapsed, passar para sidebar |
| `src/components/sidebar/AppSidebar.tsx` | Modo colapsado, botão toggle, tooltips |
| `src/components/clients/WorkoutBuilder.tsx` | Remover Resizable, usar flex fixo |
| `src/components/clients/SessionCard.tsx` | Aumentar min-width do container |

---

## Comportamento Esperado

### Sidebar Colapsável
- **Expandida (padrão)**: 256px, mostra ícones + texto
- **Colapsada**: 64px, mostra só ícones com tooltip
- **Toggle**: Botão no topo da sidebar (`<<` para colapsar, `>>` para expandir)

### Construtor de Treino
- **Sessões**: Ocupa todo espaço disponível (flex-1)
- **Cockpit**: Fixo em 380px, suficiente para boa visualização
- **Kanban**: 5 colunas sempre visíveis com scroll horizontal se necessário

### Resultado Visual

```text
┌──────────────────────────────────────────────────────────────────┐
│ << │                   CONSTRUTOR DE TREINO                      │
├────┼────────────────────────────────────────────┬────────────────┤
│ 🏠 │                                            │                │
│ 🏋 │   ┌────────────────────────────────────┐   │  ┌──────────┐  │
│ 📋 │   │ Sessão 1                      ✕    │   │  │ Perfil   │  │
│ 👥 │   │                                    │   │  │ Cliente  │  │
│    │   │ Tipo│Grupo│Exerc│Volume│Método│   │   │  └──────────┘  │
│    │   │  [  ]  [  ]  [  ]  [  ]   [  ]    │   │  ┌──────────┐  │
│    │   └────────────────────────────────────┘   │  │ Volume   │  │
│    │                                            │  │ Semanal  │  │
│    │   ┌────────────────────────────────────┐   │  └──────────┘  │
│    │   │ + Nova Sessão                      │   │      ...       │
│    │   └────────────────────────────────────┘   │                │
├────┴────────────────────────────────────────────┴────────────────┤
│                        [ Atribuir Treino ]                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Seção Técnica

### Dependências
- Nenhuma nova dependência necessária
- Remover imports não utilizados de `ResizablePanelGroup`

### Estado da Sidebar (React Context vs Props)
- Usar `useState` no AppLayout e passar via props
- Futuramente pode migrar para Context se necessário em mais lugares

### Persistência do Estado
- Salvar preferência de sidebar colapsada no `localStorage`
- Chave: `sidebar-collapsed`

### Responsividade
- Sidebar colapsável apenas em desktop (`md:` e acima)
- Em mobile, manter comportamento atual (escondida)

