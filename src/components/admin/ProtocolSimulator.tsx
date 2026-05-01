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
    treino_letra: string;
    output_id: string;
    modo_d3: boolean;
    reps: number;
    series: { min: number; max: number };
    n_exercicios: { min: number; max: number };
    safety_max: string;
    exercise_count: number;
    mobilidade: Array<{ exercise_id: string; name: string }>;
    fortalecimento: Array<{ exercise_id: string; name: string }>;
    resistido: Array<{ exercise_id: string; name: string; series_min: number; series_max: number; reps: number }>;
    alongamento: Array<{ exercise_id: string; name: string }>;
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
  const [nivel, setNivel] = useState<"iniciante" | "intermediario" | "avancado">("iniciante");
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
          nivel_experiencia: nivel,
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
                  <SelectItem value="I1">I1 — Confiante (até S2: MAC+DIV/CONV)</SelectItem>
                  <SelectItem value="I2">I2 — Receoso (até S2: MAC+DIV/CONV)</SelectItem>
                  <SelectItem value="I3">I3 — Muito inseguro (apenas S1: Máquinas guiadas)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Dor (categoria)</Label>
              <Select value={dorCat} onValueChange={(v: any) => setDorCat(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="D0">D0 — Sem dor</SelectItem>
                  <SelectItem value="D1">D1 — Leve (sub-exercícios priorizados)</SelectItem>
                  <SelectItem value="D2">D2 — Moderada (sub obrigatório, pai removido)</SelectItem>
                  <SelectItem value="D3">D3 — Limitante (remoção cirúrgica do local)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tempo disponível</Label>
              <Select value={tempoCat} onValueChange={(v: any) => setTempoCat(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="T1">T1 — 30-40min (3-5 ex)</SelectItem>
                  <SelectItem value="T2">T2 — 40-50min (4-6 ex)</SelectItem>
                  <SelectItem value="T3">T3 — 50-60min (6-8 ex)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Disposição do dia</Label>
              <Select value={disposicao} onValueChange={(v: any) => setDisposicao(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OK">OK — Disposto</SelectItem>
                  <SelectItem value="Moderada">Moderada — Reduz séries</SelectItem>
                  <SelectItem value="Comprometida">Comprometida — Séries mínimas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nível de experiência</Label>
            <Select value={nivel} onValueChange={(v: any) => setNivel(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="iniciante">Iniciante (base fixa FORT + dor)</SelectItem>
                <SelectItem value="intermediario">Intermediário (FORT só com dor)</SelectItem>
                <SelectItem value="avancado">Avançado (FORT só com dor)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Locais de dor (relevante para D1/D2/D3)</Label>
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
                Sessão {result.session.number} · Bloco {result.session.bloco} · Treino {result.session.treino_letra} ·
                Output: <strong>{result.session.output_id}</strong> ·
                {result.session.modo_d3 && " D3 Cirúrgico ·"}
                Safety: {result.session.safety_max}
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
                <Badge variant="outline">Safety máx: {result.session.safety_max}</Badge>
                <Badge variant="outline">Exercícios: {result.session.n_exercicios?.min}-{result.session.n_exercicios?.max}</Badge>
                <Badge variant="outline">Séries: {result.session.series?.min}-{result.session.series?.max}</Badge>
                <Badge variant="outline">Reps: {result.session.reps}</Badge>
                <Badge variant="outline">Total selecionado: {result.session.exercise_count}</Badge>
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
                <Dumbbell className="w-5 h-5 text-primary" /> Treino montado ({result.session.exercise_count} exercícios)
              </CardTitle>
              <CardDescription>
                Exercícios selecionados pela RPC após aplicar todos os filtros (motor único)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* MOBILIDADE */}
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                  Mobilidade ({result.session.mobilidade?.length ?? 0})
                </p>
                {(result.session.mobilidade ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Nenhum exercício</p>
                ) : (
                  (result.session.mobilidade ?? []).map((ex: any, i: number) => (
                    <div key={ex.exercise_id} className="flex items-center gap-2 p-2 rounded border border-border mb-1">
                      <Badge variant="outline" className="text-[10px]">{i + 1}</Badge>
                      <span className="text-sm">{ex.name}</span>
                    </div>
                  ))
                )}
              </div>

              {/* FORTALECIMENTO */}
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                  Fortalecimento ({result.session.fortalecimento?.length ?? 0})
                </p>
                {(result.session.fortalecimento ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    {result.context?.nivel_experiencia !== "iniciante" && result.context?.dor_cat === "D0"
                      ? "Vazio — intermediário/avançado sem dor (R5)"
                      : "Nenhum exercício"}
                  </p>
                ) : (
                  (result.session.fortalecimento ?? []).map((ex: any, i: number) => (
                    <div key={ex.exercise_id} className="flex items-center gap-2 p-2 rounded border border-border mb-1">
                      <Badge variant="outline" className="text-[10px]">{i + 1}</Badge>
                      <span className="text-sm">{ex.name}</span>
                    </div>
                  ))
                )}
              </div>

              {/* RESISTIDO */}
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                  Resistido ({(result.session.resistido ?? []).length})
                  {result.session.modo_d3 && " · D3 cirúrgico"}
                </p>
                {(result.session.resistido ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Nenhum exercício compatível com os filtros
                  </p>
                ) : (
                  (result.session.resistido ?? []).map((ex: any, i: number) => (
                    <div key={ex.exercise_id} className="flex items-center gap-2 p-2 rounded border border-border mb-1">
                      <Badge variant="outline" className="text-[10px]">{i + 1}</Badge>
                      <span className="text-sm flex-1">{ex.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {ex.series_min}-{ex.series_max}×{ex.reps}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* ALONGAMENTO */}
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                  Alongamento ({result.session.alongamento?.length ?? 0})
                </p>
                {(result.session.alongamento ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Nenhum exercício</p>
                ) : (
                  (result.session.alongamento ?? []).map((ex: any, i: number) => (
                    <div key={ex.exercise_id} className="flex items-center gap-2 p-2 rounded border border-border mb-1">
                      <Badge variant="outline" className="text-[10px]">{i + 1}</Badge>
                      <span className="text-sm">{ex.name}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
