

## Correção: Race Condition na Atribuição de Treino

### Diagnóstico

Analisando os logs da edge function, encontrei a causa do erro:

```text
19:36:53Z - workoutName: ""         ← Primeira tentativa: nome VAZIO ❌
19:36:59Z - workoutName: "Teste Alpha"  ← Segunda tentativa: nome PREENCHIDO ✓
```

**Causa:** O componente `WorkoutBuilder.tsx` chama `setTempWorkout()` para atualizar o nome e logo em seguida chama `builder.submit()`. Como o `setState` do React é assíncrono, o `submit()` é executado antes que o estado seja atualizado, enviando o nome vazio.

```typescript
// WorkoutBuilder.tsx - handleConfirmSubmit (linhas 218-233)
builder.setTempWorkout({
  ...builder.tempWorkout,
  name: workoutNameInput,   // ← Atualiza estado (ASSÍNCRONO!)
});

await builder.submit();     // ← Executa com estado ANTIGO (nome vazio)
```

---

### Solução

Modificar a função `submit()` no hook para aceitar um parâmetro opcional `workoutName`, que tem prioridade sobre o valor do estado:

**Arquivo:** `src/hooks/useClientWorkoutBuilder.ts`

1. Alterar a assinatura de `submit` para aceitar um parâmetro:
   ```typescript
   const submit = useCallback(async (workoutName?: string) => {
   ```

2. Usar o parâmetro com fallback para o estado:
   ```typescript
   const finalWorkoutName = workoutName || tempWorkout.name;
   ```

3. Validar o nome antes de enviar:
   ```typescript
   if (!finalWorkoutName.trim()) {
     toast({
       title: "Erro",
       description: "O nome do treino é obrigatório",
       variant: "destructive",
     });
     return;
   }
   ```

**Arquivo:** `src/components/clients/WorkoutBuilder.tsx`

4. Modificar `handleConfirmSubmit` para passar o nome diretamente:
   ```typescript
   const handleConfirmSubmit = async () => {
     if (!workoutNameInput.trim()) return;
     
     try {
       await builder.submit(workoutNameInput);  // Passa o nome diretamente
       setShowWorkoutNameDialog(false);
       onSuccess();
     } catch (error) {
       console.error("Erro ao criar treino:", error);
     }
   };
   ```

5. Remover a chamada desnecessária de `setTempWorkout` (opcional, mas limpa o código).

---

### Resultado Esperado

| Antes | Depois |
|-------|--------|
| 1ª tentativa falha (nome vazio) | 1ª tentativa funciona (nome passado como parâmetro) |
| 2ª tentativa funciona | --- |

---

### Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/hooks/useClientWorkoutBuilder.ts` | Adicionar parâmetro `workoutName` à função `submit` |
| `src/components/clients/WorkoutBuilder.tsx` | Passar `workoutNameInput` diretamente ao `submit()` |

