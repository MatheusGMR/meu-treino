import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Beaker, Loader2, Play, Trophy, Video, MessageSquare, Dumbbell, ListChecks } from "lucide-react";

const PERFIS = [
  { value: "P01_empurrado_pela_dor", label: "P01 — Empurrado pela dor" },
  { value: "P02_assustado_com_tempo", label: "P02 — Assustado com o tempo" },
  { value: "P03_frustrado", label: "P03 — Frustrado" },
  { value: "P04_estreante", label: "P04 — Estreante" },
  { value: "P05_sobrecarregado", label: "P05 — Sobrecarregado" },
  { value: "P06_deslocado", label: "P06 — Deslocado" },
];

const DOR_LOCAIS = ["lombar", "joelho", "ombro", "cervical", "quadril", "punho"];

interface Decision {
  text: string;
}

interface SimResult {
  session: {
    number: number;
    bloco: number;
    variant: string;
    intensity_factor: number;
    allowed_safety: string[];
    allowed_blocks: string[];
    max_exercises: number;
    exercise_count: number;
    exercises: Array<{
      id: string;
      name: string;
      primary_muscle: string | null;
      block: string | null;
      safety_level: string | null;
      video_url: string | null;
    }>;
  };
  milestone: {
    type: string;
    title: string;
    description: string | null;
    mandatory_videos: Array<{ video_code: string; title: string }>;
  } | null;
  message: string;
  template_used: {
    perfil: string | null;
    ins_cat: string | null;
    tone: string | null;
    raw: string;
  } | null;
  moment: string;
  decisions: string[];
  context: Record<string, any>;
}

export const ProtocolSimulator = () => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);

  const [sessionNumber, setSessionNumber] = useState(1);
  const [perfil, setPerfil] = useState("P04_estreante");
  const [insCat, setInsCat] = useState<"I1" | "I2" | "I3">("I2");
  const [dorCat, setDorCat] = useState<"D0" | "D1" | "D2" | "D3">("D0");
  const [dorLocal, setDorLocal] = useState<string[]>([]);
  const [tempoCat, setTempoCat] = useState<"T1" | "T2" | "T3">("T2");
  const [disposicao, setDisposicao] = useState<"OK" | "Moderada" | "Comprometida">("OK");
  const [clientName, setClientName] = useState("Maria");

  const toggleDorLocal = (loc: string) => {
    setDorLocal((prev) => (prev.includes(loc) ? prev.filter((p) => p !== loc) : [...prev, loc]));
  };

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("simulate-protocol-session", {
        body: {
          session_number: sessionNumber,
          perfil_primario: perfil,
          ins_cat: insCat,
          dor_cat: dorCat,
          dor_local: dorLocal,
          tempo_cat: tempoCat,
          disposicao,
          client_name: clientName,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? "Falha na simulação");
      setResult(data as SimResult);
      toast.success("Simulação executada");
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao simular");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Beaker className="w-5 h-5 text-primary" /> Simulador de Triagem & Sessão
          </CardTitle>
          <CardDescription>
            Configure inputs hipotéticos de anamnese + check-in e veja exatamente como o motor
            determinístico monta o treino, qual mensagem o agente envia e quais vídeos são exigidos.
            Nada é persistido no banco.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Nome do cliente (apenas para template)</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Maria"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sessão (1–36)</Label>
              <Input
                type="number"
                min={1}
                max={36}
                value={sessionNumber}
                onChange={(e) => setSessionNumber(Math.max(1, Math.min(36, Number(e.target.value) || 1)))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Perfil comportamental</Label>
              <Select value={perfil} onValueChange={setPerfil}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERFIS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Insegurança</Label>
              <Select value={insCat} onValueChange={(v: any) => setInsCat(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="I1">I1 — Confiante (S1-S3)</SelectItem>
                  <SelectItem value="I2">I2 — Receoso (S1-S2)</SelectItem>
                  <SelectItem value="I3">I3 — Muito inseguro (apenas S1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Dor (categoria)</Label>
              <Select value={dorCat} onValueChange={(v: any) => setDorCat(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="D0">D0 — Sem dor</SelectItem>
                  <SelectItem value="D1">D1 — Leve</SelectItem>
                  <SelectItem value="D2">D2 — Moderada (-30% intensidade)</SelectItem>
                  <SelectItem value="D3">D3 — Forte (suspende grupo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tempo disponível</Label>
              <Select value={tempoCat} onValueChange={(v: any) => setTempoCat(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="T1">T1 — Curto (~5 ex)</SelectItem>
                  <SelectItem value="T2">T2 — Médio (~8 ex)</SelectItem>
                  <SelectItem value="T3">T3 — Longo (~10 ex)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Disposição do dia</Label>
              <Select value={disposicao} onValueChange={(v: any) => setDisposicao(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OK">OK</SelectItem>
                  <SelectItem value="Moderada">Moderada (-15%)</SelectItem>
                  <SelectItem value="Comprometida">Comprometida (-30%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Locais de dor (relevante apenas para D2/D3)</Label>
            <div className="flex flex-wrap gap-2">
              {DOR_LOCAIS.map((loc) => {
                const active = dorLocal.includes(loc);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggleDorLocal(loc)}
                    className={`px-3 py-1 rounded-full text-xs border transition ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={handleRun} disabled={running} className="gap-2">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Simular sessão
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-primary" /> Decisões do motor
              </CardTitle>
              <CardDescription>
                Sessão {result.session.number} · Bloco {result.session.bloco} · Variação {result.session.variant} ·
                Intensidade final: <strong>{Math.round(result.session.intensity_factor * 100)}%</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-1.5">
                {result.decisions.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Badge variant="secondary" className="shrink-0">{i + 1}</Badge>
                    <span>{d}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">Safety: {result.session.allowed_safety.join(", ")}</Badge>
                <Badge variant="outline">Blocos: {result.session.allowed_blocks.join(", ")}</Badge>
                <Badge variant="outline">Máx exercícios: {result.session.max_exercises}</Badge>
                <Badge variant="outline">Selecionados: {result.session.exercise_count}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Mensagem do agente
              </CardTitle>
              <CardDescription>Momento: {result.moment}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 rounded-lg border border-border bg-muted/30">
                <p className="text-sm italic text-foreground">"{result.message}"</p>
              </div>
              {result.template_used && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Template selecionado:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.template_used.perfil && (
                      <Badge variant="outline" className="text-xs">{result.template_used.perfil}</Badge>
                    )}
                    {result.template_used.ins_cat && (
                      <Badge variant="secondary" className="text-xs">{result.template_used.ins_cat}</Badge>
                    )}
                    {result.template_used.tone && (
                      <Badge className="text-xs">tom: {result.template_used.tone}</Badge>
                    )}
                  </div>
                  <p className="font-mono text-[11px] mt-1">raw: {result.template_used.raw}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {result.milestone && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" /> Marco atingido
                </CardTitle>
                <CardDescription>{result.milestone.type}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium">{result.milestone.title}</p>
                {result.milestone.description && (
                  <p className="text-sm text-muted-foreground">{result.milestone.description}</p>
                )}
                {result.milestone.mandatory_videos.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5" /> Vídeos obrigatórios:
                    </p>
                    {result.milestone.mandatory_videos.map((v) => (
                      <div key={v.video_code} className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary" className="font-mono text-[10px]">{v.video_code}</Badge>
                        <span>{v.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-primary" /> Treino experimental ({result.session.exercise_count})
              </CardTitle>
              <CardDescription>
                Exercícios selecionados pelo motor após aplicar todos os filtros
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.session.exercises.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum exercício compatível com os filtros aplicados. Revise os critérios ou
                  popule mais exercícios na biblioteca do protocolo.
                </p>
              ) : (
                result.session.exercises.map((ex, i) => (
                  <div
                    key={ex.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card"
                  >
                    <Badge variant="outline" className="shrink-0 mt-0.5">{i + 1}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{ex.name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {ex.block && <Badge variant="secondary" className="text-[10px]">{ex.block}</Badge>}
                        {ex.safety_level && (
                          <Badge variant="outline" className="text-[10px]">{ex.safety_level}</Badge>
                        )}
                        {ex.primary_muscle && (
                          <span className="text-[11px] text-muted-foreground">{ex.primary_muscle}</span>
                        )}
                      </div>
                    </div>
                    {ex.video_url && (
                      <a
                        href={ex.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline shrink-0"
                      >
                        vídeo ↗
                      </a>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
