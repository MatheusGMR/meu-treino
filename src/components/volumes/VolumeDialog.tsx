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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { volumeSchema, type VolumeFormData } from "@/lib/schemas/volumeSchema";
import { useCreateVolume, useUpdateVolume } from "@/hooks/useVolumes";
import type { Database } from "@/integrations/supabase/types";
import { FormLabelWithTooltip } from "@/components/shared/FormLabelWithTooltip";
import { FIELD_DESCRIPTIONS } from "@/lib/fieldDescriptions";

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
      series_min: undefined,
      series_max: undefined,
      exercise_min: undefined,
      exercise_max: undefined,
      weekly_volume_description: "",
      movement_pattern: "",
      goal: "",
      min_weekly_sets: undefined,
      optimal_weekly_sets: undefined,
      max_weekly_sets: undefined,
    },
  });

  useEffect(() => {
    if (volume) {
      form.reset({
        name: volume.name,
        num_series: volume.num_series,
        num_exercises: volume.num_exercises,
        series_min: volume.series_min || undefined,
        series_max: volume.series_max || undefined,
        exercise_min: volume.exercise_min || undefined,
        exercise_max: volume.exercise_max || undefined,
        weekly_volume_description: volume.weekly_volume_description || "",
        movement_pattern: volume.movement_pattern || "",
        goal: volume.goal || "",
        min_weekly_sets: volume.min_weekly_sets || undefined,
        optimal_weekly_sets: volume.optimal_weekly_sets || undefined,
        max_weekly_sets: volume.max_weekly_sets || undefined,
      });
    } else if (!open) {
      form.reset();
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {volume ? "Editar Volume" : "Novo Volume"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="ranges">Ranges</TabsTrigger>
                <TabsTrigger value="weekly">Volume Semanal</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Volume Moderado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="num_series"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabelWithTooltip tooltip={FIELD_DESCRIPTIONS.volume.num_series} required>
                          Número de Séries
                        </FormLabelWithTooltip>
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
                        <FormLabelWithTooltip tooltip={FIELD_DESCRIPTIONS.volume.num_exercises} required>
                          Número de Exercícios
                        </FormLabelWithTooltip>
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
                </div>

                <FormField
                  control={form.control}
                  name="goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabelWithTooltip tooltip={FIELD_DESCRIPTIONS.volume.goal}>
                        Objetivo
                      </FormLabelWithTooltip>
                      <FormControl>
                        <Input placeholder="Ex: Hipertrofia / Intermediário" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="movement_pattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabelWithTooltip tooltip={FIELD_DESCRIPTIONS.volume.movement_pattern}>
                        Padrão de Movimento
                      </FormLabelWithTooltip>
                      <FormControl>
                        <Input placeholder="Ex: Push/Pull/Lower" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="ranges" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Séries</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="series_min"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mínimo</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="Ex: 7"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="series_max"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Máximo</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="Ex: 15"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Exercícios</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="exercise_min"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mínimo</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="Ex: 3"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="exercise_max"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Máximo</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="Ex: 6"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="weekly" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="weekly_volume_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição do Volume</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ex: 10–18 séries/semana"
                          {...field}
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="min_weekly_sets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabelWithTooltip tooltip={FIELD_DESCRIPTIONS.volume.min_weekly_sets}>
                          Min Semanal
                        </FormLabelWithTooltip>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Ex: 10"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="optimal_weekly_sets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabelWithTooltip tooltip={FIELD_DESCRIPTIONS.volume.optimal_weekly_sets}>
                          Ótimo Semanal
                        </FormLabelWithTooltip>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Ex: 14"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_weekly_sets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabelWithTooltip tooltip={FIELD_DESCRIPTIONS.volume.max_weekly_sets}>
                          Max Semanal
                        </FormLabelWithTooltip>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Ex: 18"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 justify-end pt-4 border-t">
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
