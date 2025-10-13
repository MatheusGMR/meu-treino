import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface WorkoutFiltersProps {
  selectedTypes: string[];
  selectedLevels: string[];
  onTypesChange: (types: string[]) => void;
  onLevelsChange: (levels: string[]) => void;
}

const TRAINING_TYPES = ["Hipertrofia", "Emagrecimento", "Musculação", "Funcional", "Outro"];
const LEVELS = ["Iniciante", "Avançado"];

export const WorkoutFilters = ({
  selectedTypes,
  selectedLevels,
  onTypesChange,
  onLevelsChange,
}: WorkoutFiltersProps) => {
  const activeFilters = selectedTypes.length + selectedLevels.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
          {activeFilters > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              {activeFilters}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Tipo de Treino</h4>
            <div className="space-y-2">
              {TRAINING_TYPES.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={() => {
                      if (selectedTypes.includes(type)) {
                        onTypesChange(selectedTypes.filter((t) => t !== type));
                      } else {
                        onTypesChange([...selectedTypes, type]);
                      }
                    }}
                  />
                  <Label htmlFor={`type-${type}`} className="text-sm cursor-pointer">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Nível</h4>
            <div className="space-y-2">
              {LEVELS.map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <Checkbox
                    id={`level-${level}`}
                    checked={selectedLevels.includes(level)}
                    onCheckedChange={() => {
                      if (selectedLevels.includes(level)) {
                        onLevelsChange(selectedLevels.filter((l) => l !== level));
                      } else {
                        onLevelsChange([...selectedLevels, level]);
                      }
                    }}
                  />
                  <Label htmlFor={`level-${level}`} className="text-sm cursor-pointer">
                    {level}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {activeFilters > 0 && (
            <>
              <Separator />
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  onTypesChange([]);
                  onLevelsChange([]);
                }}
              >
                Limpar Filtros
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
