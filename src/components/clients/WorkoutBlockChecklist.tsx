import { Card, CardContent } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { WorkoutType } from "@/hooks/useWorkoutBlockValidation";

interface BlockChecklistProps {
  checklist: Array<{ code: string; label: string; present: boolean }>;
  workoutType: WorkoutType;
  onWorkoutTypeChange: (type: WorkoutType) => void;
}

export const WorkoutBlockChecklist = ({
  checklist,
  workoutType,
  onWorkoutTypeChange,
}: BlockChecklistProps) => {
  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold">Blocos do Treino</h4>
            <p className="text-xs text-muted-foreground">
              Novos treinos exigem os 5 blocos obrigatórios
            </p>
          </div>
          <div className="w-56">
            <Label htmlFor="workout-type" className="text-xs">
              Tipo de treino
            </Label>
            <Select
              value={workoutType}
              onValueChange={(v) => onWorkoutTypeChange(v as WorkoutType)}
            >
              <SelectTrigger id="workout-type" className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Padrão</SelectItem>
                <SelectItem value="protocolo_destravamento">
                  Protocolo Destravamento
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {checklist.map((item) => (
            <div
              key={item.code}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
                item.present
                  ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
              )}
            >
              {item.present ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span className="font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
