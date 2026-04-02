

## Adotar Layout Visual do MeuTreino na Jornada do Cliente

### Contexto

O repositorio MeuTreino usa um design system minimalista: fundo branco, vermelho primario (#DC143C), tipografia system-font, cards com bordas sutis, hover com sombra vermelha, e transicoes suaves. O layout e limpo, sem dark mode forcado, com foco em hierarquia visual clara.

O projeto atual ja tem backend robusto (auth, RLS, hooks, queries). A proposta e adotar o **visual language** do MeuTreino nas telas do cliente, mantendo toda a logica e integracao existentes.

---

### Design System a Adotar

```text
Cores:     Vermelho primario (#DC143C), preto, branco, cinza claro (#f5f5f5)
Tipografia: System font stack, pesos 600-700 para titulos
Cards:     Borda 1px cinza sutil, hover com borda vermelha + sombra vermelha
Botoes:    Fundo vermelho, hover com translateY(-2px) + sombra
Radius:    8px (mais contido que o atual 12-30px)
Modo:      Light mode (remover dark mode forcado nas telas do cliente)
```

---

### Telas Afetadas e Alteracoes

#### 1. Landing Page (`src/pages/Index.tsx`)
- Adotar hero com grid 2 colunas (texto + imagem), gradiente sutil branco→cinza
- Cards de recursos com borda vermelha, hover com sombra vermelha e translateY
- CTA final com fundo gradiente vermelho, botoes invertidos (branco sobre vermelho)
- Footer escuro (gray-dark) com links centralizados
- Remover `dark` class forcada

#### 2. Login/Register (`src/pages/auth/Login.tsx`, `Register.tsx`)
- Card centralizado com sombra suave, borda cinza
- Titulo em vermelho, input com focus border vermelho + glow sutil
- Fundo gradiente branco→cinza claro

#### 3. Dashboard do Cliente (`src/pages/client/ClientDashboard.tsx`)
- Remover `dark` class e `SolidBackgroundWrapper`
- Header branco sticky com borda inferior sutil
- Card de treino principal: imagem 1:1, info-grid (tempo, reps, series) com cards cinza claro que ficam vermelhos no hover
- Barra de progresso: gradient vermelho, grid de dias com cards quadrados (completed = fundo vermelho, today = borda vermelha grossa)
- Seção "Treinos" com grid de workout-cards: imagem 16:10, hover com scale(1.03) e sombra vermelha

#### 4. Detalhes do Treino (`src/pages/client/WorkoutDetails.tsx`)
- Imagem hero quadrada com sombra
- Info-grid: cards cinza claro com label uppercase, hover com borda vermelha
- Lista de exercicios com thumbnail, nome em negrito, info em cinza
- Botao "Comecar treino" vermelho full-width no footer fixo

#### 5. Execucao do Treino (`src/pages/client/WorkoutSessionExecution.tsx`)
- Remover dark mode forcado
- Fundo branco, video/imagem no topo (aspect-ratio 1:1 ou 16:10 em card com sombra)
- Nome do exercicio grande e preto (nao branco)
- Control panel no bottom: card branco com sombra, borda sutil
- Barra de progresso com gradiente vermelho
- Series tracker: inputs com focus vermelho, botao "Concluir Serie" vermelho
- Timer de descanso: circulo com stroke vermelho
- Navegacao: botoes com borda preta (anterior) e fundo vermelho (proximo)

#### 6. Tela de Conclusao (NOVA: `src/pages/client/WorkoutComplete.tsx`)
- Fundo branco, checkmark animado verde
- Resumo: tempo total, exercicios, series, volume total
- Cards de metricas estilo info-card (cinza claro, hover vermelho)
- Botoes: "Voltar ao Dashboard" (vermelho) e "Ver Historico" (outline preto)
- Feedback de dificuldade: 3 opcoes com emoji (Facil/Ideal/Dificil)

#### 7. Bottom Navigation (`src/components/client/BottomNavigation.tsx`)
- Fundo branco, borda superior cinza sutil
- Tab ativa: icone preenchido + texto em vermelho
- Estilo limpo, sem sombra exagerada

#### 8. Welcome Splash (`src/components/client/WelcomeSplash.tsx`)
- Fundo gradiente vermelho (manter), tipografia branca grande
- Transicao fade-in suave

---

### Componentes a Atualizar (Estilo)

| Componente | Mudanca principal |
|------------|-------------------|
| `WorkoutCard.tsx` | Card com imagem 16:10, borda sutil, hover com scale + sombra vermelha |
| `SeriesTracker.tsx` | Input focus vermelho, botao vermelho, layout mais limpo |
| `RestTimer.tsx` | Circulo com stroke vermelho sobre fundo branco |
| `SessionProgressBar.tsx` | Barra com gradiente vermelho, texto preto |
| `ExerciseListItem.tsx` | Thumbnail + nome em negrito + info cinza, hover com borda vermelha |
| `DayCarousel.tsx` | Cards quadrados: completed=fundo vermelho, today=borda vermelha |

---

### Ajustes no CSS Global (`src/index.css`)

- Atualizar `--primary` para `348 83% 47%` (equivalente HSL de #DC143C)
- Atualizar `--radius` para `0.5rem` (8px)
- Remover ou ajustar variaveis de dark mode que forcam fundo escuro nas telas do cliente
- Manter dark mode disponivel para as telas do personal/admin (nao afetadas)

---

### Integracao com Backend

Nenhuma alteracao no backend. Todas as queries, hooks, RLS policies e edge functions permanecem identicas. As mudancas sao puramente visuais/CSS nos componentes React existentes.

---

### Nova Rota e Componentes

| Arquivo | Acao |
|---------|------|
| `src/pages/client/WorkoutComplete.tsx` | Criar — tela de conclusao |
| `src/components/client/WorkoutFeedbackDialog.tsx` | Criar — feedback de dificuldade |
| `src/components/client/AbandonWorkoutDialog.tsx` | Criar — encerramento antecipado |
| `src/App.tsx` | Adicionar rota `/client/workout/complete/:scheduleId` |

**Migration SQL:** Adicionar `difficulty_rating text`, `abandon_reason text`, `completed_exercises_count integer`, `total_weight_lifted numeric` a `daily_workout_schedule`.

---

### Arquivos a Modificar

| Arquivo | Escopo |
|---------|--------|
| `src/index.css` | Ajustar primary color e radius |
| `src/pages/Index.tsx` | Redesign visual completo (layout MeuTreino) |
| `src/pages/auth/Login.tsx` | Estilo card centralizado light |
| `src/pages/auth/Register.tsx` | Idem |
| `src/pages/client/ClientDashboard.tsx` | Remover dark, adotar layout light |
| `src/pages/client/WorkoutDetails.tsx` | Info-grid, imagem hero, estilo light |
| `src/pages/client/WorkoutSessionExecution.tsx` | Layout light, control panel branco |
| `src/pages/client/WorkoutComplete.tsx` | NOVO — tela de conclusao |
| `src/components/client/WorkoutCard.tsx` | Card estilo MeuTreino |
| `src/components/client/BottomNavigation.tsx` | Estilo light limpo |
| `src/components/client/SeriesTracker.tsx` | Inputs/botoes estilo vermelho |
| `src/components/client/RestTimer.tsx` | Circulo vermelho sobre branco |
| `src/components/client/SessionProgressBar.tsx` | Gradiente vermelho |
| `src/components/client/DayCarousel.tsx` | Cards dia com estilo MeuTreino |
| `src/components/client/WorkoutFeedbackDialog.tsx` | NOVO |
| `src/components/client/AbandonWorkoutDialog.tsx` | NOVO |
| `src/App.tsx` | Nova rota |

