import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bot, Save, Plus, Trash2, GripVertical, Sparkles } from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface MacroInstruction {
  id: string;
  context: string;
  instruction: string;
}

const PERSONALITY_OPTIONS = [
  { value: "profissional", label: "Profissional", desc: "Direto, técnico e objetivo" },
  { value: "motivador", label: "Motivador", desc: "Encorajador e entusiasmado" },
  { value: "educador", label: "Educador", desc: "Didático, explica o porquê" },
  { value: "amigavel", label: "Amigável", desc: "Informal, acolhedor" },
];

const TONE_OPTIONS = [
  { value: "formal", label: "Formal" },
  { value: "semiformal", label: "Semiformal" },
  { value: "informal", label: "Informal" },
  { value: "tecnico", label: "Técnico" },
];

const DEFAULT_SYSTEM_PROMPT = `Você é um personal trainer virtual experiente e dedicado. Seu papel é auxiliar na criação de treinos personalizados, análise de anamneses e acompanhamento de clientes.

Sempre considere:
- O perfil completo do cliente (anamnese, restrições, objetivos)
- Princípios de periodização e progressão de carga
- Segurança e prevenção de lesões
- Individualidade biológica`;

const CONTEXT_OPTIONS = [
  "Montagem de treino",
  "Revisão de treino",
  "Análise de anamnese",
  "Feedback pós-treino",
  "Check-in diário",
  "Sugestões de exercícios",
  "Progressão de carga",
  "Personalizado",
];

export default function AIAgentSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);

  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [personality, setPersonality] = useState("profissional");
  const [tone, setTone] = useState("semiformal");
  const [macros, setMacros] = useState<MacroInstruction[]>([
    {
      id: crypto.randomUUID(),
      context: "Montagem de treino",
      instruction: "Considerar o nível de experiência, restrições médicas, objetivos e frequência semanal disponível do cliente. Priorizar exercícios multiarticulares para iniciantes.",
    },
    {
      id: crypto.randomUUID(),
      context: "Revisão de treino",
      instruction: "Verificar se o volume semanal está adequado ao perfil, se há equilíbrio entre grupos musculares, e se as progressões estão coerentes com o histórico de desempenho.",
    },
  ]);

  useEffect(() => {
    loadConfig();
  }, [user?.id]);

  const loadConfig = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_agent_config")
        .select("*")
        .eq("owner_id", user.id)
        .eq("config_type", "global")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfigId(data.id);
        setSystemPrompt(data.system_prompt || DEFAULT_SYSTEM_PROMPT);
        setPersonality(data.personality || "profissional");
        setTone(data.tone || "semiformal");
        const savedMacros = data.macro_instructions as unknown;
        if (Array.isArray(savedMacros) && savedMacros.length > 0) {
          setMacros(savedMacros as MacroInstruction[]);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar config:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const payload = {
        owner_id: user.id,
        config_type: "global",
        system_prompt: systemPrompt,
        personality,
        tone,
        macro_instructions: macros as unknown as Record<string, unknown>[],
        updated_at: new Date().toISOString(),
      };

      if (configId) {
        const { error } = await supabase
          .from("ai_agent_config")
          .update(payload)
          .eq("id", configId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("ai_agent_config")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        setConfigId(data.id);
      }

      toast.success("Configurações do Agente IA salvas com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar:", err);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const addMacro = () => {
    setMacros((prev) => [
      ...prev,
      { id: crypto.randomUUID(), context: "Montagem de treino", instruction: "" },
    ]);
  };

  const removeMacro = (id: string) => {
    setMacros((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMacro = (id: string, field: keyof MacroInstruction, value: string) => {
    setMacros((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Agente de IA</h1>
              <p className="text-sm text-muted-foreground">
                Configure o comportamento da IA em toda a plataforma
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>

        {/* System Prompt */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Prompt do Sistema
            </CardTitle>
            <CardDescription>
              Instrução base que define como o agente se comporta em todas as interações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={8}
              placeholder="Descreva o papel, conhecimentos e regras gerais do agente..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Este prompt será enviado como contexto em todas as chamadas de IA da plataforma.
            </p>
          </CardContent>
        </Card>

        {/* Personality & Tone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personalidade</CardTitle>
              <CardDescription>Como o agente se apresenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {PERSONALITY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    personality === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="personality"
                    value={opt.value}
                    checked={personality === opt.value}
                    onChange={(e) => setPersonality(e.target.value)}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <span className="font-medium text-foreground">{opt.label}</span>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tom de Comunicação</CardTitle>
              <CardDescription>Nível de formalidade nas respostas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="p-3 rounded-lg bg-muted/50 mt-4">
                <p className="text-sm font-medium text-foreground mb-1">Pré-visualização</p>
                <p className="text-sm text-muted-foreground italic">
                  {tone === "formal" &&
                    '"Prezado(a), com base na sua anamnese, recomendo uma frequência de 4x por semana..."'}
                  {tone === "semiformal" &&
                    '"Olá! Com base na sua avaliação, o ideal seria treinar 4x por semana..."'}
                  {tone === "informal" &&
                    '"E aí! Pelo que vi na sua ficha, bora com 4 treinos por semana..."'}
                  {tone === "tecnico" &&
                    '"Considerando os parâmetros antropométricos e o nível de condicionamento, prescrevo 4 sessões semanais..."'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Macro Instructions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Instruções Macro</CardTitle>
                <CardDescription>
                  Regras específicas que a IA deve seguir em cada contexto de uso
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addMacro} className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {macros.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhuma instrução macro configurada</p>
                <p className="text-xs">Clique em "Adicionar" para criar regras específicas por contexto</p>
              </div>
            )}

            {macros.map((macro, index) => (
              <div
                key={macro.id}
                className="p-4 rounded-lg border border-border bg-card space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="secondary" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeMacro(macro.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div>
                  <Label className="text-sm">Contexto de aplicação</Label>
                  <Select
                    value={macro.context}
                    onValueChange={(v) => updateMacro(macro.id, "context", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTEXT_OPTIONS.map((ctx) => (
                        <SelectItem key={ctx} value={ctx}>
                          {ctx}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm">Instrução</Label>
                  <Textarea
                    value={macro.instruction}
                    onChange={(e) => updateMacro(macro.id, "instruction", e.target.value)}
                    rows={3}
                    placeholder="Ex: Ao montar o treino, sempre considerar o histórico de lesões e priorizar exercícios com baixo impacto articular..."
                    className="mt-1 text-sm"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Bottom save */}
        <div className="flex justify-end pb-6">
          <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar configurações"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
