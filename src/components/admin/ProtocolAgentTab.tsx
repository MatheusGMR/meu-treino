import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Video, MessageSquare, RefreshCw, ShieldCheck, Loader2 } from "lucide-react";

interface Milestone {
  id: string;
  session_number: number;
  milestone_type: string;
  title: string;
  description: string | null;
  required_video_codes: string[] | null;
  jmp_action: string | null;
}
interface AgentVideo {
  id: string;
  video_code: string;
  title: string;
  description: string | null;
  mandatory_at_session: number | null;
}
interface Template {
  id: string;
  perfil_primario: string | null;
  ins_cat: string | null;
  moment: string;
  tone: string | null;
  template: string;
}

const HIERARCHY = [
  "Dor D3 (suspende grupos doloridos)",
  "Dor D2 (reduz intensidade 30%)",
  "Tempo disponível (T1/T2/T3)",
  "Disposição (OK / Moderada / Comprometida)",
  "Insegurança (I1/I2/I3 → safety S1-S3)",
  "Alternância A/B por sessão",
  "Mobilidade — nunca suprime",
];

export const ProtocolAgentTab = () => {
  const [loading, setLoading] = useState(true);
  const [reseeding, setReseeding] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [videos, setVideos] = useState<AgentVideo[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const load = async () => {
    setLoading(true);
    const [m, v, t] = await Promise.all([
      supabase.from("protocol_milestones").select("*").order("session_number"),
      supabase.from("agent_videos").select("*").order("video_code"),
      supabase.from("agent_communication_templates").select("*").eq("active", true),
    ]);
    if (m.data) setMilestones(m.data as any);
    if (v.data) setVideos(v.data as any);
    if (t.data) setTemplates(t.data as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleReseed = async () => {
    setReseeding(true);
    try {
      const { error } = await supabase.functions.invoke("seed-agent-rules");
      if (error) throw error;
      toast.success("Diretrizes do Protocolo re-importadas");
      await load();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao re-importar diretrizes");
    } finally {
      setReseeding(false);
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-48" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Motor Determinístico
            </CardTitle>
            <CardDescription>
              Hierarquia de regras aplicada ao montar cada sessão do Protocolo Destravamento
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleReseed} disabled={reseeding} className="gap-2">
            {reseeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Re-importar diretrizes
          </Button>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {HIERARCHY.map((rule, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <Badge variant="secondary" className="shrink-0">{i + 1}</Badge>
                <span className="text-foreground">{rule}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" /> Marcos do Protocolo ({milestones.length})
          </CardTitle>
          <CardDescription>9 sessões-chave que disparam vídeos obrigatórios e/ou alertas JMP</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum marco carregado. Clique em "Re-importar diretrizes".</p>
          ) : milestones.map((m) => (
            <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
              <Badge variant="outline" className="shrink-0 mt-0.5">Sessão {m.session_number}</Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{m.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.milestone_type}</p>
                {m.required_video_codes?.length ? (
                  <p className="text-xs text-primary mt-1">📹 {m.required_video_codes.join(", ")}</p>
                ) : null}
                {m.jmp_action && <p className="text-xs text-muted-foreground italic mt-1">JMP: {m.jmp_action}</p>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" /> Vídeos do Agente ({videos.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {videos.map((v) => (
            <div key={v.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
              <Badge variant="secondary" className="shrink-0 font-mono text-xs">{v.video_code}</Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{v.title}</p>
                {v.description && <p className="text-xs text-muted-foreground mt-0.5">{v.description}</p>}
                {v.mandatory_at_session && (
                  <p className="text-xs text-primary mt-1">Obrigatório na sessão {v.mandatory_at_session}</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> Templates de Comunicação ({templates.length})
          </CardTitle>
          <CardDescription>Mensagens calibradas por perfil comportamental × insegurança × momento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {templates.map((t) => (
            <div key={t.id} className="p-3 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {t.perfil_primario && <Badge variant="outline" className="text-xs">{t.perfil_primario.replace(/_/g, " ")}</Badge>}
                {t.ins_cat && <Badge variant="secondary" className="text-xs">{t.ins_cat}</Badge>}
                <Badge className="text-xs">{t.moment}</Badge>
                {t.tone && <span className="text-xs text-muted-foreground">tom: {t.tone}</span>}
              </div>
              <p className="text-sm text-foreground italic">"{t.template}"</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
