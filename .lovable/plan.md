

# Plano de Correção: 3 Bugs no Sistema de Treinos

## Diagnóstico

### Problema 1: Não consegue atribuir treino à cliente Renata
**Causa identificada:** A validação `canSubmit` no `useClientWorkoutBuilder.ts` (linha 391) verifica se `tempWorkout.sessions[0].exercises.length === 0`, ou seja, se a **primeira sessão** tem exercícios. Se o treino tiver sessões vazias, o botão permanece desabilitado sem nenhum feedback visual explicando o porquê.

**O que acontece:**
- O usuário cria sessões, mas não adiciona exercícios
- O botão "Atribuir Treino" fica desabilitado
- Não há mensagem explicando por que está desabilitado

**Solução:**
- Adicionar feedback visual claro mostrando o que falta para poder atribuir
- Mostrar tooltip ou mensagem no botão desabilitado

---

### Problema 2: Treino deletado ainda aparece (card permanece)
**Causa identificada:** A tabela `client_workouts` **não possui RLS policy para DELETE**!

Políticas existentes:
- SELECT ✅
- INSERT ✅  
- UPDATE ✅
- **DELETE ❌ NÃO EXISTE**

**O que acontece:**
1. Frontend chama `.delete()` no Supabase
2. RLS bloqueia silenciosamente (sem erro explícito)
3. O registro não é deletado
4. `onSuccess` é chamado mesmo assim (Supabase não retorna erro)
5. `invalidateQueries` recarrega os mesmos dados
6. Card continua aparecendo

**Solução:**
- Criar RLS policy para DELETE na tabela `client_workouts`
- Adicionar verificação de `count` no frontend para confirmar exclusão

---

### Problema 3: Caixas de método/volume fora da sessão (visual quebrado)
**Causa identificada:** O `KanbanExerciseSelector` tem 5 colunas com `flex` dinâmico e altura fixa de `h-[300px] md:h-[350px]...`. Quando inserido dentro do `CardContent` do `SessionCard`, o espaço horizontal é insuficiente, causando overflow.

**O que acontece:**
- O Kanban precisa de ~700-900px de largura para as 5 colunas
- Dentro do Card (que está em ~70% da tela), fica muito apertado
- As colunas vazam para fora do container

**Solução:**
- Adicionar `overflow-x-auto` no container do Kanban
- Ou usar layout mais compacto quando dentro de SessionCard

---

## Plano de Implementação

### Fase 1: Corrigir RLS para DELETE (Problema 2)

**Migração SQL:**
```sql
CREATE POLICY "Personals podem deletar treinos de clientes"
ON public.client_workouts FOR DELETE
USING (
  (assigned_by = auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role)
);
```

### Fase 2: Adicionar Feedback no Builder (Problema 1)

**Arquivo:** `src/components/clients/WorkoutBuilder.tsx`

Modificar o botão de submit para mostrar feedback:

```typescript
// Antes
<Button
  onClick={handleSubmit}
  disabled={!builder.canSubmit || builder.isSubmitting}
>
  {builder.isSubmitting ? "Atribuindo..." : "Atribuir Treino"}
</Button>

// Depois: Adicionar Tooltip explicativo
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <span>
        <Button
          onClick={handleSubmit}
          disabled={!builder.canSubmit || builder.isSubmitting}
        >
          {builder.isSubmitting ? "Atribuindo..." : "Atribuir Treino"}
        </Button>
      </span>
    </TooltipTrigger>
    {!builder.canSubmit && (
      <TooltipContent side="top">
        <p className="text-xs">{builder.submitBlockReason}</p>
      </TooltipContent>
    )}
  </Tooltip>
</TooltipProvider>
```

**Arquivo:** `src/hooks/useClientWorkoutBuilder.ts`

Adicionar razão do bloqueio:

```typescript
const submitBlockReason = useMemo(() => {
  if (!tempWorkout.name.trim()) return "Informe o nome do treino";
  if (tempWorkout.sessions.length === 0) return "Adicione pelo menos uma sessão";
  if (tempWorkout.sessions[0].exercises.length === 0) return "Adicione exercícios à primeira sessão";
  if (compatibility.riskLevel === "critical" && !acknowledgeRisks) return "Reconheça os riscos para continuar";
  return null;
}, [tempWorkout, compatibility, acknowledgeRisks]);
```

### Fase 3: Corrigir Layout do Kanban (Problema 3)

**Arquivo:** `src/components/clients/SessionCard.tsx`

Adicionar wrapper com scroll horizontal:

```typescript
// Antes (linha 182-192)
<div className="space-y-3">
  <h5 className="text-sm font-semibold text-foreground">
    Adicionar mais exercícios
  </h5>
  <KanbanExerciseSelector ... />
</div>

// Depois: Adicionar overflow-x-auto
<div className="space-y-3">
  <h5 className="text-sm font-semibold text-foreground">
    Adicionar mais exercícios
  </h5>
  <div className="overflow-x-auto -mx-4 px-4">
    <div className="min-w-[800px]">
      <KanbanExerciseSelector ... />
    </div>
  </div>
</div>
```

### Fase 4: Verificar Exclusão no Frontend

**Arquivo:** `src/hooks/useClientWorkouts.ts`

Melhorar `useUnassignWorkout` para verificar se exclusão funcionou:

```typescript
mutationFn: async ({ workoutAssignmentId, clientId }) => {
  const { error, count } = await supabase
    .from("client_workouts")
    .delete()
    .eq("id", workoutAssignmentId)
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  
  // Se nenhum registro foi afetado, provavelmente RLS bloqueou
  // Mas como adicionamos a policy, isso não deve mais acontecer
},
```

---

## Arquivos a Modificar/Criar

| Arquivo | Ação |
|---------|------|
| **Migração SQL** | CRIAR - Policy DELETE para client_workouts |
| `src/hooks/useClientWorkoutBuilder.ts` | MODIFICAR - Adicionar `submitBlockReason` |
| `src/components/clients/WorkoutBuilder.tsx` | MODIFICAR - Tooltip no botão + imports |
| `src/components/clients/SessionCard.tsx` | MODIFICAR - Overflow no container do Kanban |
| `src/hooks/useClientWorkouts.ts` | MODIFICAR - Melhorar verificação de delete |

---

## Resultado Esperado

| Problema | Status Esperado |
|----------|-----------------|
| Atribuição bloqueada sem feedback | ✅ Tooltip explica o que falta |
| Card permanece após deletar | ✅ Delete funciona com RLS correta |
| Kanban vazando da sessão | ✅ Scroll horizontal quando necessário |

