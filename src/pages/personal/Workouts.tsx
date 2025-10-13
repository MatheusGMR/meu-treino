import { useState } from "react";
import { AppLayout } from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { WorkoutsTable } from "@/components/workouts/WorkoutsTable";
import { WorkoutDialog } from "@/components/workouts/WorkoutDialog";
import { WorkoutFilters } from "@/components/workouts/WorkoutFilters";
import { useWorkouts } from "@/hooks/useWorkouts";

export default function Workouts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);

  const { data: workouts, isLoading } = useWorkouts({
    types: selectedTypes,
    levels: selectedLevels,
    search,
  });

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Treinos
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Gerencie seus treinos completos
            </p>
          </div>
          <Button variant="hero" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Treino
          </Button>
        </div>

        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar treinos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <WorkoutFilters
            selectedTypes={selectedTypes}
            selectedLevels={selectedLevels}
            onTypesChange={setSelectedTypes}
            onLevelsChange={setSelectedLevels}
          />
        </div>

        <WorkoutsTable workouts={workouts || []} isLoading={isLoading} />

        <WorkoutDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      </div>
    </AppLayout>
  );
}
