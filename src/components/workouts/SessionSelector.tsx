import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSessions } from "@/hooks/useSessions";
import type { WorkoutSessionData } from "@/lib/schemas/workoutSchema";

interface SessionSelectorProps {
  value: WorkoutSessionData[];
  onChange: (sessions: WorkoutSessionData[]) => void;
}

export const SessionSelector = ({ value, onChange }: SessionSelectorProps) => {
  const { data: availableSessions } = useSessions();

  const addSession = (sessionId: string) => {
    const newSession: WorkoutSessionData = {
      session_id: sessionId,
      order_index: value.length,
    };
    onChange([...value, newSession]);
  };

  const removeSession = (index: number) => {
    const newSessions = value.filter((_, i) => i !== index);
    onChange(newSessions.map((s, i) => ({ ...s, order_index: i })));
  };

  const selectedIds = value.map((s) => s.session_id);
  const unselectedSessions = availableSessions?.filter((s) => !selectedIds.includes(s.id));

  return (
    <div className="space-y-4">
      <Select onValueChange={addSession}>
        <SelectTrigger>
          <SelectValue placeholder="Adicionar sessão..." />
        </SelectTrigger>
        <SelectContent>
          {unselectedSessions?.map((session) => (
            <SelectItem key={session.id} value={session.id}>
              {session.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhuma sessão adicionada
        </p>
      )}

      {value.map((session, index) => {
        const sessionInfo = availableSessions?.find((s) => s.id === session.session_id);

        return (
          <Card key={index} className="p-4">
            <div className="flex items-center gap-3">
              <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
              <div className="flex-1">
                <p className="font-medium">{sessionInfo?.name}</p>
                <p className="text-sm text-muted-foreground">{sessionInfo?.description}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeSession(index)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
