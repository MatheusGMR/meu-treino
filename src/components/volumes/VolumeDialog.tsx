import { useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { volumeSchema, type VolumeFormData } from "@/lib/schemas/volumeSchema";
import { useCreateVolume, useUpdateVolume } from "@/hooks/useVolumes";
import type { Database } from "@/integrations/supabase/types";

type Volume = Database["public"]["Tables"]["volumes"]["Row"];

interface VolumeDialogProps {
  volume?: Volume;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VolumeDialog = ({
  volume,
  open,
  onOpenChange,
}: VolumeDialogProps) => {
  const createMutation = useCreateVolume();
  const updateMutation = useUpdateVolume();

  const form = useForm<VolumeFormData>({
    resolver: zodResolver(volumeSchema),
    defaultValues: {
      name: "",
      num_series: 3,
      num_exercises: 1,
    },
  });

  useEffect(() => {
    if (volume) {
      form.reset({
        name: volume.name,
        num_series: volume.num_series,
        num_exercises: volume.num_exercises,
      });
    } else if (!open) {
      form.reset({
        name: "",
        num_series: 3,
        num_exercises: 1,
      });
    }
  }, [volume, open, form]);

  const onSubmit = (data: VolumeFormData) => {
    if (volume) {
      updateMutation.mutate(
        { id: volume.id, data },
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {volume ? "Editar Volume" : "Novo Volume"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 3x12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="num_series"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Séries *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="num_exercises"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Exercícios *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
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
                {volume ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
