import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientProfileSchema, type ClientProfile } from "@/lib/schemas/clientSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUpdateClientProfile } from "@/hooks/useClients";
import { Save, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ClientInfoFormProps {
  clientId: string;
  profile: any;
}

export const ClientInfoForm = ({ clientId, profile }: ClientInfoFormProps) => {
  const updateProfile = useUpdateClientProfile();

  // Buscar dados da anamnese calculados pela IA
  const { data: anamnesis } = useQuery({
    queryKey: ["anamnesis", clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("anamnesis")
        .select("imc_calculado, imc_categoria, nivel_experiencia, calculated_profile, profile_confidence_score")
        .eq("client_id", clientId)
        .maybeSingle();
      return data;
    },
    enabled: !!clientId,
  });

  const form = useForm<ClientProfile>({
    resolver: zodResolver(clientProfileSchema),
    defaultValues: {
      full_name: profile.full_name || "",
      phone: profile.phone || "",
      birth_date: profile.birth_date || "",
      gender: profile.gender || undefined,
      emergency_contact: profile.emergency_contact || "",
      emergency_phone: profile.emergency_phone || "",
      medical_conditions: profile.medical_conditions || "",
      goals: profile.goals || "",
      notes: profile.notes || "",
    },
  });

  const onSubmit = async (data: ClientProfile) => {
    await updateProfile.mutateAsync({ clientId, data });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="text-2xl">
            {profile.full_name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Label htmlFor="full_name">Nome Completo *</Label>
          <Input id="full_name" {...form.register("full_name")} />
          {form.formState.errors.full_name && (
            <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>
          )}
        </div>
      </div>

      {/* Seção: Análise da IA */}
      {anamnesis && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Análise da IA
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            {anamnesis.imc_calculado && (
              <div>
                <span className="text-muted-foreground">IMC:</span>
                <span className="ml-2 font-medium">
                  {anamnesis.imc_calculado.toFixed(1)} - {anamnesis.imc_categoria}
                </span>
              </div>
            )}
            {anamnesis.nivel_experiencia && (
              <div>
                <span className="text-muted-foreground">Nível:</span>
                <span className="ml-2 font-medium">{anamnesis.nivel_experiencia}</span>
              </div>
            )}
            {anamnesis.calculated_profile && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Perfil:</span>
                <span className="ml-2 font-medium">{anamnesis.calculated_profile}</span>
              </div>
            )}
            {anamnesis.profile_confidence_score && (
              <div>
                <span className="text-muted-foreground">Confiança:</span>
                <Badge variant="outline" className="ml-2">
                  {(anamnesis.profile_confidence_score * 100).toFixed(0)}%
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="birth_date">Data de Nascimento</Label>
          <Input id="birth_date" type="date" {...form.register("birth_date")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Sexo</Label>
          <Select
            value={form.watch("gender") || undefined}
            onValueChange={(value) => form.setValue("gender", value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Masculino">Masculino</SelectItem>
              <SelectItem value="Feminino">Feminino</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" {...form.register("phone")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergency_contact">Contato de Emergência</Label>
          <Input id="emergency_contact" {...form.register("emergency_contact")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergency_phone">Telefone de Emergência</Label>
          <Input id="emergency_phone" {...form.register("emergency_phone")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="medical_conditions">Condições Médicas</Label>
        <Textarea id="medical_conditions" {...form.register("medical_conditions")} rows={3} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="goals">Objetivos</Label>
        <Textarea id="goals" {...form.register("goals")} rows={3} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas do Personal</Label>
        <Textarea id="notes" {...form.register("notes")} rows={3} />
      </div>

      <Button type="submit" disabled={updateProfile.isPending}>
        <Save className="h-4 w-4 mr-2" />
        {updateProfile.isPending ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </form>
  );
};
