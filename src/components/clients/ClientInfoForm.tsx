import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientProfileSchema, type ClientProfile } from "@/lib/schemas/clientSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUpdateClientProfile } from "@/hooks/useClients";
import { Save, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

// Helper para calcular data de nascimento a partir da idade
const calculateBirthDate = (age: number | null): string => {
  if (!age) return "";
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  return `${birthYear}-01-01`;
};

// Helper para formatar condições médicas
const formatMedicalConditions = (anamnesis: any): string => {
  if (!anamnesis) return "";
  const parts: string[] = [];
  
  if (anamnesis.medical_restrictions?.length > 0) {
    parts.push(`Restrições: ${anamnesis.medical_restrictions.join(", ")}`);
  }
  if (anamnesis.medical_restrictions_details) {
    parts.push(`Detalhes: ${anamnesis.medical_restrictions_details}`);
  }
  if (anamnesis.has_injury_or_surgery && anamnesis.injury_type) {
    parts.push(`Lesão/Cirurgia: ${anamnesis.injury_type}`);
    if (anamnesis.injury_details) {
      parts.push(`Detalhes da lesão: ${anamnesis.injury_details}`);
    }
  }
  if (anamnesis.has_joint_pain && anamnesis.pain_locations?.length > 0) {
    parts.push(`Dores: ${anamnesis.pain_locations.join(", ")}`);
    if (anamnesis.pain_details) {
      parts.push(`Detalhes das dores: ${anamnesis.pain_details}`);
    }
  }
  
  return parts.join("\n");
};

// Helper para formatar objetivos
const formatGoals = (anamnesis: any): string => {
  if (!anamnesis) return "";
  const parts: string[] = [];
  
  if (anamnesis.primary_goal) {
    parts.push(`Objetivo Principal: ${anamnesis.primary_goal}`);
  }
  if (anamnesis.secondary_goals?.length > 0) {
    parts.push(`Objetivos Secundários: ${anamnesis.secondary_goals.join(", ")}`);
  }
  if (anamnesis.desired_body_type) {
    parts.push(`Biotipo Desejado: ${anamnesis.desired_body_type}`);
  }
  
  return parts.join("\n");
};

interface ClientInfoFormProps {
  clientId: string;
  profile: any;
}

export const ClientInfoForm = ({ clientId, profile }: ClientInfoFormProps) => {
  const updateProfile = useUpdateClientProfile();

  // Buscar dados completos da anamnese
  const { data: anamnesis } = useQuery({
    queryKey: ["anamnesis", clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("anamnesis")
        .select("*")
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

  // Preencher formulário automaticamente quando anamnese carregar
  useEffect(() => {
    if (anamnesis) {
      form.reset({
        full_name: profile.full_name || "",
        phone: profile.phone || anamnesis.contato || "",
        birth_date: profile.birth_date || calculateBirthDate(anamnesis.age) || "",
        gender: (profile.gender || anamnesis.gender) as any,
        emergency_contact: profile.emergency_contact || "",
        emergency_phone: profile.emergency_phone || "",
        medical_conditions: profile.medical_conditions || formatMedicalConditions(anamnesis) || "",
        goals: profile.goals || formatGoals(anamnesis) || "",
        notes: profile.notes || "",
      });
    }
  }, [anamnesis, profile, form]);

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="birth_date">Data de Nascimento</Label>
            {anamnesis?.age && !profile.birth_date && (
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Preenchido pela IA
              </Badge>
            )}
          </div>
          <Input id="birth_date" type="date" {...form.register("birth_date")} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="gender">Sexo</Label>
            {anamnesis?.gender && !profile.gender && (
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Preenchido pela IA
              </Badge>
            )}
          </div>
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
          <div className="flex items-center gap-2">
            <Label htmlFor="phone">Telefone</Label>
            {anamnesis?.contato && !profile.phone && (
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Preenchido pela IA
              </Badge>
            )}
          </div>
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
        <div className="flex items-center gap-2">
          <Label htmlFor="medical_conditions">Condições Médicas</Label>
          {anamnesis && !profile.medical_conditions && formatMedicalConditions(anamnesis) && (
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Preenchido pela IA
            </Badge>
          )}
        </div>
        <Textarea id="medical_conditions" {...form.register("medical_conditions")} rows={3} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="goals">Objetivos</Label>
          {anamnesis && !profile.goals && formatGoals(anamnesis) && (
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Preenchido pela IA
            </Badge>
          )}
        </div>
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
