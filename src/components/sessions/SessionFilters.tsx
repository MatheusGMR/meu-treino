import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface SessionFiltersProps {
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
}

const SESSION_TYPES = ["Mobilidade", "Alongamento", "Musculação"];

export const SessionFilters = ({
  selectedTypes,
  onTypesChange,
}: SessionFiltersProps) => {
  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter((t) => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
          {selectedTypes.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              {selectedTypes.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Tipo de Sessão</h4>
            <div className="space-y-2">
              {SESSION_TYPES.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={() => toggleType(type)}
                  />
                  <Label
                    htmlFor={`type-${type}`}
                    className="text-sm cursor-pointer"
                  >
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {selectedTypes.length > 0 && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => onTypesChange([])}
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
