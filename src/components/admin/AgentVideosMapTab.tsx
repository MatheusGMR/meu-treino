import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, ExternalLink } from "lucide-react";
import { PILAR_OPTIONS, PILAR_LABELS } from "@/lib/schemas/agentVideoSchema";
import { cn } from "@/lib/utils";

const NIVEIS = ["I1", "I2", "I3"] as const;

const TABELA_REGRA = [
  { ins: "Alta", exp: "Sem", nivel: "I3", obs: "—" },
  { ins: "Alta", exp: "Com", nivel: "I3", obs: "Cria alerta revisao_nivel_I3 (sessão 6)" },
  { ins: "Média", exp: "Sem", nivel: "I2", obs: "—" },
  { ins: "Média", exp: "Com", nivel: "I1", obs: "Experiência puxa para baixo" },
  { ins: "Baixa", exp: "Sem", nivel: "I2", obs: "—" },
  { ins: "Baixa", exp: "Com", nivel: "I1", obs: "Experiência puxa para baixo" },
];

const HIERARQUIA = [
  { ordem: 1, nome: "Marcos por sessão", desc: "Sessões 1, 13, 25, 36 — INTRO/PROG/FIM obrigatórios", color: "bg-purple-500" },
  { ordem: 2, nome: "Modo Seguro", desc: "Dor consecutiva ≥ 3: dispara D3-01 + D3-02 + MS-01", color: "bg-red-500" },
  { ordem: 3, nome: "Dor D2/D3", desc: "Check-in com dor sem modo seguro", color: "bg-orange-500" },
  { ordem: 4, nome: "ENC-I3 obrigatório", desc: "I3 nas sessões 1-6 e marcos 12/18/24", color: "bg-blue-500" },
  { ordem: 5, nome: "1ª vez do exercício", desc: "Setup; obrigatório se I3, opcional se I1/I2", color: "bg-cyan-500" },
  { ordem: 6, nome: "Opcionais do nível", desc: "Vídeos do (pilar, ins_cat, momento, bloco)", color: "bg-emerald-500" },
];

const MARCOS_OBRIGATORIOS = [
  { sessao: 1, evento: "Intro do protocolo", videos: "VID-INTRO-01, VID-INTRO-02" },
  { sessao: 6, evento: "Checkpoint I3 (revisão de nível)", videos: "VID-ENC-I3-02" },
  { sessao: 12, evento: "Marco fim do bloco 1", videos: "VID-ENC-I2-02 / VID-ENC-I3-02" },
  { sessao: 13, evento: "Abertura do Bloco 2", videos: "VID-PROG-B2" },
  { sessao: 18, evento: "Marco intermediário I3", videos: "VID-ENC-I3-02" },
  { sessao: 24, evento: "Marco fim do bloco 2", videos: "VID-ENC-I2-02 / VID-ENC-I3-02" },
  { sessao: 25, evento: "Abertura do Bloco 3", videos: "VID-PROG-B3" },
  { sessao: 36, evento: "Encerramento do protocolo", videos: "VID-FIM-01" },
];

interface CountRow {
  pilar: string;
  ins_cat: string | null;
  total: number;
  ready: number;
}

export const AgentVideosMapTab = () => {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<CountRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("agent_videos")
        .select("pilar, recommended_for_ins_cat, youtube_url, active")
        .eq("active", true);
      const map = new Map<string, CountRow>();
      for (const r of data ?? []) {
        const key = `${r.pilar ?? "—"}__${r.recommended_for_ins_cat ?? "any"}`;
        const existing = map.get(key) ?? {
          pilar: r.pilar ?? "—",
          ins_cat: r.recommended_for_ins_cat ?? null,
          total: 0,
          ready: 0,
        };
        existing.total += 1;
        if (r.youtube_url) existing.ready += 1;
        map.set(key, existing);
      }
      setCounts(Array.from(map.values()));
      setLoading(false);
    };
    load();
  }, []);

  const cellFor = (pilar: string, nivel: string | null) =>
    counts.find((c) => c.pilar === pilar && (c.ins_cat ?? "any") === (nivel ?? "any"));

  return (
    <div className="space-y-6">
      {/* Card 1: Tabela ins_cat */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atribuição de nível (regra "nunca sobe")</CardTitle>
          <CardDescription>
            Como insegurança × experiência prévia determinam o ins_cat fixo do cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left p-2">Insegurança</th>
                  <th className="text-left p-2">Experiência</th>
                  <th className="text-left p-2">Nível</th>
                  <th className="text-left p-2">Observação</th>
                </tr>
              </thead>
              <tbody>
                {TABELA_REGRA.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-2">{r.ins}</td>
                    <td className="p-2">{r.exp}</td>
                    <td className="p-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono",
                          r.nivel === "I3" && "border-red-500/50 text-red-700 dark:text-red-400",
                          r.nivel === "I2" && "border-amber-500/50 text-amber-700 dark:text-amber-400",
                          r.nivel === "I1" && "border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
                        )}
                      >
                        {r.nivel}
                      </Badge>
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">{r.obs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Hierarquia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hierarquia de disparo</CardTitle>
          <CardDescription>
            O motor avalia em camadas — a primeira que casa, dispara. Camadas inferiores ainda contribuem com vídeos opcionais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {HIERARQUIA.map((h) => (
            <div key={h.ordem} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shrink-0", h.color)}>
                {h.ordem}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{h.nome}</p>
                <p className="text-xs text-muted-foreground">{h.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Card 3: Heatmap */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Mapa de produção (pilar × nível)</CardTitle>
            <CardDescription>
              Verde: todos com URL configurada. Amarelo: parcial. Cinza: pendentes.
            </CardDescription>
          </div>
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link to="/admin/agent-videos">
              <Settings className="w-4 h-4" />
              Gerenciar vídeos
              <ExternalLink className="w-3 h-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="text-left p-2">Pilar</th>
                    {NIVEIS.map((n) => (
                      <th key={n} className="text-center p-2">{n}</th>
                    ))}
                    <th className="text-center p-2">Sem nível</th>
                  </tr>
                </thead>
                <tbody>
                  {PILAR_OPTIONS.map((pilar) => {
                    const hasAny = NIVEIS.some((n) => cellFor(pilar, n)) || cellFor(pilar, null);
                    if (!hasAny) return null;
                    return (
                      <tr key={pilar} className="border-t">
                        <td className="p-2 font-medium">{PILAR_LABELS[pilar]}</td>
                        {[...NIVEIS, null].map((n, i) => {
                          const c = cellFor(pilar, n);
                          if (!c) return <td key={i} className="p-2 text-center text-muted-foreground/30">—</td>;
                          const ratio = c.ready / c.total;
                          const cls =
                            ratio === 1
                              ? "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/40"
                              : ratio > 0
                              ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40"
                              : "bg-muted text-muted-foreground border-border";
                          return (
                            <td key={i} className="p-1.5 text-center">
                              <span className={cn("inline-block px-2 py-1 rounded border font-mono", cls)}>
                                {c.ready}/{c.total}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 4: Marcos obrigatórios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Marcos obrigatórios por sessão</CardTitle>
          <CardDescription>Sessões-chave em que o motor sempre exibe vídeos específicos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {MARCOS_OBRIGATORIOS.map((m) => (
            <div key={m.sessao} className="flex items-center gap-3 p-2.5 rounded-lg border bg-card text-sm">
              <Badge variant="outline" className="shrink-0 font-mono">Sessão {m.sessao}</Badge>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{m.evento}</p>
                <p className="text-xs text-muted-foreground font-mono">{m.videos}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
