import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ExerciseSelector } from "./ExerciseSelector";
import { sessionSchema, type SessionFormData } from "@/lib/schemas/sessionSchema";
import {
  useCreateSession,
  useUpdateSession,
  useSessionWithExercises,
} from "@/hooks/useSessions";

interface SessionDialogProps {
  session?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SESSION_TYPES = ["Mobilidade", "Alongamento", "Musculação"];

export const SessionDialog = ({
  session,
  open,
  onOpenChange,
}: SessionDialogProps) => {
  const createMutation = useCreateSession();
  const updateMutation = useUpdateSession();
  const { data: sessionData } = useSessionWithExercises(session?.id || "");

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      description: "",
      session_type: "Musculação",
      exercises: [],
    },
  });

  useEffect(() => {
    if (sessionData) {
      const exercises =
        sessionData.session_exercises?.map((se: any, index: number) => ({
          exercise_id: se.exercise_id,
          order_index: index,
          sets: se.sets || undefined,
          reps: se.reps || undefined,
          rest_time: se.rest_time || undefined,
          notes: se.notes || undefined,
        })) || [];

      form.reset({
        description: sessionData.description,
        session_type: sessionData.session_type as any,
        exercises,
      });
    } else if (!session) {
      form.reset({
        description: "",
        session_type: "Musculação",
        exercises: [],
      });
    }
  }, [sessionData, session, form]);

  const onSubmit = (data: SessionFormData) => {
    if (session) {
      updateMutation.mutate(
        { id: session.id, data },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {session ? "Editar Sessão" : "Nova Sessão"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Peito A, Pernas B..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="session_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Sessão *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SESSION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exercises"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exercícios *</FormLabel>
                  <FormControl>
                    <ExerciseSelector
                      sessionType={form.watch("session_type")}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {session ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
