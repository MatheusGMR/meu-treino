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
import { Textarea } from "@/components/ui/textarea";
import { FormDescription } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { methodSchema, type MethodFormData } from "@/lib/schemas/methodSchema";
import { useCreateMethod, useUpdateMethod } from "@/hooks/useMethods";
import type { Database } from "@/integrations/supabase/types";
import { FormLabelWithTooltip } from "@/components/shared/FormLabelWithTooltip";
import { FIELD_DESCRIPTIONS } from "@/lib/fieldDescriptions";

type Method = Database["public"]["Tables"]["methods"]["Row"];

interface MethodDialogProps {
  method?: Method;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LOAD_LEVELS = ["Alta", "Média", "Baixa"] as const;

export const MethodDialog = ({
  method,
  open,
  onOpenChange,
}: MethodDialogProps) => {
  const createMutation = useCreateMethod();
  const updateMutation = useUpdateMethod();

  const form = useForm<MethodFormData>({
    resolver: zodResolver(methodSchema),
    defaultValues: {
      name: "",
      reps_min: 8,
      reps_max: 12,
      reps_description: "",
      rest_seconds: 60,
      load_level: "Média",
      cadence_contraction: 2,
      cadence_pause: 1,
      cadence_stretch: 2,
      objective: undefined,
      risk_level: "Baixo risco",
      video_url: "",
      energy_cost: "Médio",
      recommended_combination: "",
    },
  });

  useEffect(() => {
    if (method && open) {
      form.reset({
        name: method.name || "",
        reps_min: method.reps_min,
        reps_max: method.reps_max,
        reps_description: method.reps_description || "",
        rest_seconds: method.rest_seconds,
        load_level: method.load_level as "Alta" | "Média" | "Baixa",
        cadence_contraction: method.cadence_contraction,
        cadence_pause: method.cadence_pause,
        cadence_stretch: method.cadence_stretch,
        objective: method.objective || undefined,
        risk_level: method.risk_level as any,
        video_url: method.video_url || "",
        energy_cost: method.energy_cost as any,
        recommended_combination: method.recommended_combination || "",
      });
    } else if (!method && !open) {
      form.reset({
        name: "",
        reps_min: 8,
        reps_max: 12,
        reps_description: "",
        rest_seconds: 60,
        load_level: "Média",
        cadence_contraction: 2,
        cadence_pause: 1,
        cadence_stretch: 2,
        objective: undefined,
        risk_level: "Baixo risco",
        video_url: "",
        energy_cost: "Médio",
        recommended_combination: "",
      });
    }
  }, [method, open, form]);

  const onSubmit = (data: MethodFormData) => {
    if (method) {
      updateMutation.mutate(
        { id: method.id, data },
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {method ? "Editar Método" : "Novo Método"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Drop Set" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reps_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repetições Mínimas *</FormLabel>
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
                name="reps_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repetições Máximas *</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="objective"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithTooltip tooltip={FIELD_DESCRIPTIONS.method.objective[field.value as keyof typeof FIELD_DESCRIPTIONS.method.objective] || "Selecione um objetivo para ver a descrição"}>
                      Objetivo
                    </FormLabelWithTooltip>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o objetivo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Hipertrofia">Hipertrofia</SelectItem>
                        <SelectItem value="Força">Força</SelectItem>
                        <SelectItem value="Resistência">Resistência</SelectItem>
                        <SelectItem value="Potência">Potência</SelectItem>
                        <SelectItem value="Hipertrofia + Força">Hipertrofia + Força</SelectItem>
                        <SelectItem value="Força + Hipertrofia">Força + Hipertrofia</SelectItem>
                        <SelectItem value="Equilíbrio / Hipertrofia">Equilíbrio / Hipertrofia</SelectItem>
                        <SelectItem value="Hipertrofia pesada">Hipertrofia pesada</SelectItem>
                        <SelectItem value="Força + Potência">Força + Potência</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="risk_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithTooltip tooltip={FIELD_DESCRIPTIONS.method.risk_level[field.value as keyof typeof FIELD_DESCRIPTIONS.method.risk_level] || "Selecione um nível para ver a descrição"}>
                      Nível de Risco
                    </FormLabelWithTooltip>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o risco" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Baixo risco">Baixo risco</SelectItem>
                        <SelectItem value="Médio risco">Médio risco</SelectItem>
                        <SelectItem value="Alto risco">Alto risco</SelectItem>
                        <SelectItem value="Alto risco de fadiga">Alto risco de fadiga</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="energy_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabelWithTooltip tooltip={FIELD_DESCRIPTIONS.method.energy_cost[field.value as keyof typeof FIELD_DESCRIPTIONS.method.energy_cost] || "Selecione um custo para ver a descrição"}>
                    Custo Energético
                  </FormLabelWithTooltip>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o custo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Alto">Alto</SelectItem>
                      <SelectItem value="Médio">Médio</SelectItem>
                      <SelectItem value="Baixo">Baixo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="video_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Vídeo (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Link do YouTube para referência visual
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recommended_combination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Combinação Recomendada (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Pode ser combinado com Drop-set"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Orientações sobre combinações com outros métodos
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reps_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição de Repetições (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Falha + Reduções, 10×10"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Para métodos especiais com formato não convencional
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rest_seconds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithTooltip tooltip={FIELD_DESCRIPTIONS.method.rest_seconds} required>
                      Descanso (segundos)
                    </FormLabelWithTooltip>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
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
                name="load_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithTooltip tooltip={FIELD_DESCRIPTIONS.method.load_level} required>
                      Nível de Carga
                    </FormLabelWithTooltip>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LOAD_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="cadence_contraction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithTooltip tooltip={FIELD_DESCRIPTIONS.method.cadence_contraction} required>
                      Cadência: Contração
                    </FormLabelWithTooltip>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
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
                name="cadence_pause"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithTooltip tooltip={FIELD_DESCRIPTIONS.method.cadence_pause} required>
                      Cadência: Pausa
                    </FormLabelWithTooltip>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
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
                name="cadence_stretch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithTooltip tooltip={FIELD_DESCRIPTIONS.method.cadence_stretch} required>
                      Cadência: Alongamento
                    </FormLabelWithTooltip>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {method ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
