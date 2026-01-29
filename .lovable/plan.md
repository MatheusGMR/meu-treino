
## Objetivo
Fazer a coluna **“Método”** ficar sempre acessível/visível como a 5ª coluna do Kanban dentro do quadro da sessão, sem “vazar” para fora do card, e sem depender do usuário “adivinhar” o scroll horizontal. Se necessário, reduzir larguras/gaps para caber melhor.

---

## Diagnóstico (por que “Método” pode não aparecer)
Hoje o `KanbanExerciseSelector` renderiza a coluna **Método** no JSX (ela existe), então o problema é quase certamente **layout/overflow**:

1. O Kanban usa um `flex` de 5 colunas com “efeito baralho” (coluna ativa cresce `flex-[3]`), o que pode gerar **largura total maior** do que o espaço disponível.
2. Em alguns contextos (principalmente dentro do card da sessão), a largura “extra” pode estar ficando **cortada** sem um scroll horizontal claro, então a coluna 5 fica fora da área visível.
3. Mesmo quando existe `overflow-x-auto` no `SessionCard`, ainda pode acontecer do scroll “não ser óbvio” e o usuário não perceber que precisa arrastar para ver a última coluna.

A solução mais robusta é garantir que **o próprio Kanban** seja um “scroll container” horizontal e, quando o fluxo chega no passo do Método (ao selecionar o Volume), o sistema **role automaticamente** para a coluna do Método.

---

## Estratégia de correção (sem reduzir o número de colunas)
### Parte A — Scroll horizontal “dentro” do Kanban (para não vazar em nenhum lugar)
**Arquivo:** `src/components/clients/KanbanExerciseSelector.tsx`

1. **Envolver o grid de colunas** (o `<div className="flex gap-4 ...">`) em um container com:
   - `overflow-x-auto`
   - `overscroll-x-contain` (para melhorar o toque/trackpad)
   - `pb-2` (para não cortar scrollbar, quando existir)
2. Garantir que as colunas não “estourem” para fora do card, porque agora ficam “recortadas” dentro do scroll container.

Resultado: em qualquer lugar que o Kanban for usado (ex.: `SessionCard` e `SessionEditorInline`), as 5 colunas ficam contidas e acessíveis.

---

### Parte B — Auto-scroll para a coluna ativa (o usuário sempre “vê” o Método quando chega nele)
**Arquivo:** `src/components/clients/KanbanExerciseSelector.tsx`

1. Criar refs para as colunas:
   - `const columnRefs = useRef<(HTMLDivElement | null)[]>([])`
2. Em cada coluna (Tipo/Grupo/Exercício/Volume/Método), setar `ref={(el) => (columnRefs.current[i] = el)}`
3. Adicionar um `useEffect` que, ao mudar `activeColumnIndex`, faz:
   - `columnRefs.current[activeColumnIndex]?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" })`

Resultado prático: ao selecionar **Volume**, `activeColumnIndex` vai para 4, e o UI automaticamente traz a coluna **Método** para dentro do viewport do Kanban.

---

### Parte C — Reduzir “aperto” (opcional, mas recomendado pelo seu feedback)
Ainda mantendo 5 colunas, podemos reduzir o espaço consumido para diminuir a chance de a coluna “Método” ficar longe:

**Arquivo:** `src/components/clients/KanbanExerciseSelector.tsx`

1. Diminuir gaps:
   - de `gap-4 lg:gap-6` para algo como `gap-3 lg:gap-4`
2. Diminuir o `min-w` das colunas:
   - de `min-w-[140px]` para `min-w-[120px]` (principalmente em telas menores)
3. (Opcional avançado) Trocar o sistema de `flex-[3]/[1]/[0.5]` por larguras fixas com `shrink-0` (ex.: ativo 320px, restantes 150px), deixando a largura total mais previsível. Só faremos isso se, mesmo com scroll + auto-scroll, ainda ficar ruim visualmente.

---

## Ajustes nos locais onde o Kanban é embutido
### SessionCard
**Arquivo:** `src/components/clients/SessionCard.tsx`

- Como o Kanban passará a cuidar do scroll horizontal internamente, vamos:
  1. Remover ou simplificar o wrapper externo `overflow-x-auto` para evitar “scroll duplo”.
  2. Manter apenas o wrapper de alinhamento `-mx-6 px-6 pb-2` (se necessário para layout), deixando o overflow por conta do Kanban.

### SessionEditorInline
**Arquivo:** `src/components/clients/SessionEditorInline.tsx`

- Não precisa adicionar wrapper novo: como o Kanban agora se auto-contém, ele não vai mais “vazar” nesse componente também.

---

## Critérios de aceite (como vamos validar)
1. No card de sessão, você consegue sempre ver a coluna **Método** (ou pelo menos ela aparece automaticamente quando você seleciona um Volume).
2. Nenhuma coluna “vaza” para fora do quadro da sessão.
3. O Kanban continua com as 5 colunas (Tipo, Grupo, Exercício, Volume, Método).
4. O comportamento fica bom tanto no `SessionCard` quanto no `SessionEditorInline`.

---

## Arquivos que serão alterados
- `src/components/clients/KanbanExerciseSelector.tsx` (scroll horizontal interno + auto-scroll + ajustes de largura/gap)
- `src/components/clients/SessionCard.tsx` (remover/simplificar wrapper de scroll externo para evitar scroll duplo)
- `src/components/clients/SessionEditorInline.tsx` (apenas se precisar ajustar espaçamentos, mas a meta é não precisar)

---

## Risco/impacto
Baixo risco funcional (não mexe em dados). O risco principal é visual (scroll duplo, quebra do “efeito baralho”). Por isso, a implementação será incremental:
1) scroll interno + auto-scroll (essencial)  
2) ajuste de gap/min-width (refino)  
3) só se necessário, refatorar o “efeito baralho” para larguras fixas (opcional)

