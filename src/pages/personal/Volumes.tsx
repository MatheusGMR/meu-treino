import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVolumes } from "@/hooks/useVolumes";
import { VolumesTable } from "@/components/volumes/VolumesTable";
import { VolumeDialog } from "@/components/volumes/VolumeDialog";

const Volumes = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: volumes, isLoading } = useVolumes(search);

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
      </div>

      <VolumesTable volumes={volumes || []} isLoading={isLoading} />

      <VolumeDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};

export default Volumes;
