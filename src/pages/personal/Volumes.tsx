import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVolumes } from "@/hooks/useVolumes";
import { VolumesTable } from "@/components/volumes/VolumesTable";
import { VolumeDialog } from "@/components/volumes/VolumeDialog";

const Volumes = () => {
  const [search, setSearch] = useState("");
  const [goalFilter, setGoalFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: volumes, isLoading } = useVolumes(search, goalFilter === "all" ? "" : goalFilter);

  // Extract unique goals for filter
  const uniqueGoals = useMemo(() => {
    if (!volumes) return [];
    const goals = volumes
      .map(v => v.goal)
      .filter((g): g is string => !!g);
    return Array.from(new Set(goals)).sort();
  }, [volumes]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Volumes</h1>
          <p className="text-muted-foreground">
            Gerencie os volumes de treinamento
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Volume
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        
        <Select value={goalFilter} onValueChange={setGoalFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por objetivo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os objetivos</SelectItem>
            {uniqueGoals.map((goal) => (
              <SelectItem key={goal} value={goal}>
                {goal}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <VolumesTable volumes={volumes || []} isLoading={isLoading} />

      <VolumeDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};

export default Volumes;
