import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface ExerciseNotesProps {
  notes?: string | null;
}

export const ExerciseNotes = ({ notes }: ExerciseNotesProps) => {
  if (!notes) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold mb-2">Observações</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {notes}
          </p>
        </div>
      </div>
    </Card>
  );
};
