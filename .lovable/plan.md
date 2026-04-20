

## Biblioteca de Exercícios v2.0 + Estrutura de Blocos

Importação completa do documento `Biblioteca_Exercicios_MeuTreino_v2.docx`, com novo modelo de ID, coluna de Segurança e estrutura de 5 blocos obrigatórios para treinos.

### O que muda

**1. Novo modelo de ID dos exercícios**
Formato: `[BLOCO]-[EQUIP]-[SEG]-[DIFIC]-[NÚM]` (ex: `MS-MAC-S1-BI-001`)
- BLOCO: MOB, FORT, MS, MI, CARD, ALONG
- EQUIP: PC (Peso Corporal), ELAS (Elástico), MAC (Máquina), DIV (Articulado Divergente), CONV (Articulado Convergente), CAB (Cabo/Polia), HAL (Halter), BAR (Barra/Smith)
- SEG: S1 (Muito Seguro) → S5 (Baixo)
- DIFIC: BI, BII, BIII, IN1–IN5, AV

**2. Novas colunas em `exercises`**
- `external_id` (text, único): código no novo formato
- `safety_level` (S1–S5): nível de segurança
- `difficulty_code` (BI…AV): código de dificuldade
- `block` (MOB/FORT/MS/MI/CARD/ALONG): bloco do treino
- `equipment_code` (PC/ELAS/MAC/DIV/CONV/CAB/HAL/BAR): equipamento normalizado
- `movement` (texto): padrão de movimento
- `variation` (texto): variação

**3. Estrutura de 5 blocos obrigatórios em treinos**
Mapeamento dos blocos do documento:

| Bloco no app | Origem documento | Obrigatório em |
|---|---|---|
| Aquecimento | MOB (Mobilidade) | Todos |
| Fortalecimento | FORT (Fortalecimento/Neuromotor) | Todos |
| Exercício Resistido | MS + MI (Musculação) | Todos |
| Cardio | CARD | Todos exceto Protocolo Destravamento |
| Alongamento | ALONG | Todos |

- Nova coluna `workout_type` em `workouts` (`standard` ou `protocolo_destravamento`)
- Nova coluna `block` em `sessions` (qual bloco a sessão preenche)
- Validação no `WorkoutBuilder`: bloqueia salvar novo treino se faltar bloco obrigatório (Cardio dispensado quando `workout_type='protocolo_destravamento'`)
- Treinos existentes não são afetados — validação só roda em novos

**4. Restrições por limitação (apêndice do documento)**
Importa as 3 tabelas de limitação (Ombro, Coluna Lombar, Joelho) para `medical_condition_exercise_restrictions`, vinculando exercício original → substituição recomendada via `external_id`.

### Plano de migração de dados (estratégia "atualizar por nome")

1. Migration cria as novas colunas + novos enums (sem destruir dados).
2. Edge function `migrate-exercise-library`:
   - Lê os ~150 exercícios do documento (embarcado como JSON na função).
   - Para cada um: tenta casar por `LOWER(name)` com exercício existente.
     - **Match**: faz UPDATE preenchendo `external_id`, `safety_level`, `difficulty_code`, `block`, `equipment_code`, `movement`, `variation` — sem mexer em vídeo, descrição etc.
     - **Sem match**: faz INSERT como novo exercício oficial v2.0.
   - Importa as restrições do apêndice.
   - Retorna stats: matched, inserted, restrictions_added.
3. Página admin `/admin/library-migration` com botão "Importar Biblioteca v2.0" que invoca a função e mostra o relatório.

### Mudanças na UI

- **WorkoutBuilder**: agrupa sessões por bloco (Aquecimento → Fortalecimento → Resistido → Cardio → Alongamento). Mostra checklist no topo com blocos preenchidos. Botão "Salvar" desabilitado com tooltip se faltar bloco obrigatório.
- **Seleção de tipo de treino**: dropdown `workout_type` (Padrão / Protocolo Destravamento) na criação.
- **ExercisesTable**: nova coluna "ID" (external_id) e "Segurança" (badge S1–S5 colorido). Filtro por bloco e nível de segurança.
- **ExerciseDialog**: novos campos editáveis para os atributos v2.0.

### Detalhes técnicos

- Migrations:
  1. Criar enums `exercise_block_enum` (MOB, FORT, MS, MI, CARD, ALONG), `safety_level_enum` (S1–S5), `equipment_code_enum`, `workout_type_enum` (standard, protocolo_destravamento).
  2. ALTER TABLE `exercises` ADD colunas + UNIQUE em `external_id`.
  3. ALTER TABLE `workouts` ADD `workout_type` DEFAULT 'standard'.
  4. ALTER TABLE `sessions` ADD `block` (exercise_block_enum, nullable).
- Edge function: `migrate-exercise-library` (verify_jwt=true, requer admin).
- Validação cliente: hook `useWorkoutBlockValidation` consumido pelo `WorkoutBuilder`.
- Tipos TypeScript regenerados automaticamente após a migration.

### Arquivos novos/alterados

- `supabase/migrations/<ts>_exercise_library_v2.sql` (novo)
- `supabase/functions/migrate-exercise-library/index.ts` (novo, com JSON da biblioteca embarcado)
- `supabase/functions/migrate-exercise-library/library-data.ts` (novo, dataset completo do documento)
- `src/pages/admin/LibraryMigration.tsx` (novo)
- `src/hooks/useWorkoutBlockValidation.ts` (novo)
- `src/components/clients/WorkoutBuilder.tsx` (agrupamento por bloco + validação)
- `src/components/exercises/ExercisesTable.tsx` (colunas ID + Segurança)
- `src/components/exercises/ExerciseDialog.tsx` (novos campos)
- `src/components/exercises/ExerciseFilters.tsx` (filtros bloco/segurança)
- `src/lib/schemas/exerciseSchema.ts` + `workoutSchema.ts` + `sessionSchema.ts` (novos campos)
- `src/hooks/useExercises.ts` (novos campos no insert/update)
- `src/App.tsx` (rota da página de migração)
- `src/components/sidebar/AppSidebar.tsx` (item de menu para admin)

### Após aprovação

1. Criar a migration (você aprova).
2. Deploy da edge function com o dataset completo dos ~150 exercícios + 17 restrições do apêndice.
3. Atualizar UI (filtros, builder, dialog).
4. Você acessa `/admin/library-migration` e clica para importar — relatório mostra quantos foram atualizados vs criados.

