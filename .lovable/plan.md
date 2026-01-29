

## Objetivo
Substituir o efeito de expansão (scale) no hover dos botões do seletor por um efeito de inversão de cores.

---

## Problema Atual

No arquivo `src/components/clients/SelectionCard.tsx`, linha 73, existe:
```
"hover:shadow-md hover:scale-[1.02]"
```

Este efeito de escala pode parecer conflitante com outras animações e cria uma sensação de "salto" visual.

---

## Solução Proposta

**Arquivo:** `src/components/clients/SelectionCard.tsx`

### Mudança Principal

Substituir `hover:scale-[1.02]` por classes que invertem as cores no hover:

**De:**
```typescript
"hover:shadow-md hover:scale-[1.02]",
isSelected 
  ? "border-primary bg-primary/10 shadow-sm" 
  : "border-border bg-card hover:border-primary/50",
```

**Para:**
```typescript
"hover:shadow-md",
isSelected 
  ? "border-primary bg-primary text-primary-foreground shadow-sm" 
  : "border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary",
```

### Detalhes da Implementação

1. **Estado normal (não selecionado)**:
   - Fundo: `bg-card` (cor de fundo do card)
   - Texto: cor padrão (foreground)
   - Borda: `border-border`

2. **Hover (não selecionado)**:
   - Fundo: `bg-primary` (cor primária - laranja)
   - Texto: `text-primary-foreground` (texto que contrasta com primário)
   - Borda: `border-primary`

3. **Selecionado**:
   - Fundo: `bg-primary` (cor primária sólida)
   - Texto: `text-primary-foreground`
   - Borda: `border-primary`

4. **Remover**: `hover:scale-[1.02]` de ambos os estados

---

## Ajuste Complementar

Também será removido o `hover:scale-100` da linha de disabled (linha 77):
```typescript
// De:
disabled && "opacity-50 cursor-not-allowed hover:scale-100"

// Para:
disabled && "opacity-50 cursor-not-allowed"
```

---

## Resultado Visual

```text
Antes:
┌─────────────────┐
│  Peito          │  → mouse entra → card aumenta de tamanho (scale 1.02)
└─────────────────┘

Depois:
┌─────────────────┐
│  Peito          │  → mouse entra → fundo fica laranja, texto fica branco
└─────────────────┘
```

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/clients/SelectionCard.tsx` | Substituir hover:scale por hover com inversão de cores |

