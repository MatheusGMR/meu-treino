import { useState } from "react";
import { AppLayout } from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { ExercisesTable } from "@/components/exercises/ExercisesTable";
import { ExerciseDialog } from "@/components/exercises/ExerciseDialog";
import { useExercises } from "@/hooks/useExercises";

export default function Exercises() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const { data: exercises, isLoading } = useExercises({
    groups: selectedGroups,
    search,
  });

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Exercícios
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Gerencie seu banco de exercícios
            </p>
          </div>
          <Button variant="hero" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Exercício
          </Button>
        </div>

        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, grupo muscular, nível ou tipo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <ExercisesTable exercises={exercises || []} isLoading={isLoading} />

        <ExerciseDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      </div>
    </AppLayout>
  );
}
