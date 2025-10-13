import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface ExerciseFiltersProps {
  selectedGroups: string[];
  selectedIntensities: string[];
  onGroupsChange: (groups: string[]) => void;
  onIntensitiesChange: (intensities: string[]) => void;
}

const EXERCISE_GROUPS = [
  "Abdômen",
  "Peito",
  "Costas",
  "Pernas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Glúteos",
  "Panturrilha",
  "Outro",
];

const INTENSITIES = ["Fácil", "Intermediário", "Difícil"];

export const ExerciseFilters = ({
  selectedGroups,
  selectedIntensities,
  onGroupsChange,
  onIntensitiesChange,
}: ExerciseFiltersProps) => {
  const toggleGroup = (group: string) => {
    if (selectedGroups.includes(group)) {
      onGroupsChange(selectedGroups.filter((g) => g !== group));
    } else {
      onGroupsChange([...selectedGroups, group]);
    }
  };

  const toggleIntensity = (intensity: string) => {
    if (selectedIntensities.includes(intensity)) {
      onIntensitiesChange(selectedIntensities.filter((i) => i !== intensity));
    } else {
      onIntensitiesChange([...selectedIntensities, intensity]);
    }
  };

  const activeFilters =
    selectedGroups.length + selectedIntensities.length;

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
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Grupo Muscular</h4>
            <div className="space-y-2">
              {EXERCISE_GROUPS.map((group) => (
                <div key={group} className="flex items-center space-x-2">
                  <Checkbox
                    id={`group-${group}`}
                    checked={selectedGroups.includes(group)}
                    onCheckedChange={() => toggleGroup(group)}
                  />
                  <Label
                    htmlFor={`group-${group}`}
                    className="text-sm cursor-pointer"
                  >
                    {group}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Intensidade</h4>
            <div className="space-y-2">
              {INTENSITIES.map((intensity) => (
                <div key={intensity} className="flex items-center space-x-2">
                  <Checkbox
                    id={`intensity-${intensity}`}
                    checked={selectedIntensities.includes(intensity)}
                    onCheckedChange={() => toggleIntensity(intensity)}
                  />
                  <Label
                    htmlFor={`intensity-${intensity}`}
                    className="text-sm cursor-pointer"
                  >
                    {intensity}
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
                  onGroupsChange([]);
                  onIntensitiesChange([]);
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
