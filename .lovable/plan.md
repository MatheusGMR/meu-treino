

## Correção: Footer Fixo no Construtor de Treino

### Problema Identificado

O `WorkoutBuilder` usa `h-full`, mas a cadeia de containers ancestrais não propaga altura corretamente:

```text
AppLayout (min-h-screen)
  → main (overflow-auto)
    → container p-6 (SEM altura definida)
      → TabsContent (SEM altura definida)
        → WorkoutBuilder (h-full) ← NÃO FUNCIONA!
```

O `h-full` (100%) só funciona quando **todos os ancestrais** têm altura explícita. Como o container pai não tem, o `h-full` não tem referência e o footer rola junto com o conteúdo.

---

### Solução

Usar altura calculada com `100vh` menos os espaços do layout:
- Padding do container: `p-6` = 24px × 2 = 48px
- Header do cliente (nome + tabs): ~120px
- Margem de segurança

**Arquivo:** `src/components/clients/WorkoutBuilder.tsx`

```text
┌─────────────────────────────────────────────────────────────┐
│ ← Construtor de Treino (Header)         [flex-shrink-0]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Sessões do Treino]              [Perfil do Cliente]       │
│  ┌──────────────────┐             ┌──────────────────┐      │
│  │ overflow-y-auto  │             │ overflow-y-auto  │      │
│  │ (scroll interno) │             │ (scroll interno) │      │
│  └──────────────────┘             └──────────────────┘      │
│                   ↑ flex-1 min-h-0 ↑                        │
├─────────────────────────────────────────────────────────────┤
│                           [Cancelar]  [Atribuir] (FIXO)     │
│                                          [flex-shrink-0]    │
└─────────────────────────────────────────────────────────────┘
```

### Alterações

**Linha 236**: Trocar `h-full` por altura calculada
```typescript
// De:
<div className="flex flex-col h-full">

// Para:
<div className="flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
```

O valor `200px` cobre:
- Padding superior do container (24px)
- Header da página ClientDetails (tabs, nome ~80px)
- Padding inferior (24px)
- Margem de segurança (~72px)

Isso garante que:
1. O container principal tenha altura fixa baseada na viewport
2. O header e footer usem `flex-shrink-0` para não encolher
3. A área central com `flex-1 min-h-0` ocupe o espaço restante
4. Cada coluna (sessões e cockpit) role independentemente

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/clients/WorkoutBuilder.tsx` | Trocar `h-full` por `height: calc(100vh - 200px)` |

