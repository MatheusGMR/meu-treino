import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Search, Video, CheckCircle2, AlertCircle } from "lucide-react";

import { useAgentVideos, type AgentVideoRow } from "@/hooks/useAgentVideos";
import { AgentVideoDialog } from "@/components/admin/AgentVideoDialog";
import {
  PILAR_LABELS,
  PILAR_OPTIONS,
  MOMENTO_LABELS,
} from "@/lib/schemas/agentVideoSchema";
import { cn } from "@/lib/utils";

const NIVEIS = ["all", "I1", "I2", "I3"] as const;

export default function AgentVideos() {
  const { list, remove } = useAgentVideos();
  const [search, setSearch] = useState("");
  const [pilarFilter, setPilarFilter] = useState<string>("all");
  const [nivelFilter, setNivelFilter] = useState<(typeof NIVEIS)[number]>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "ready" | "pending">("all");
  const [editing, setEditing] = useState<AgentVideoRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AgentVideoRow | null>(null);

  const videos = list.data ?? [];

  const filtered = useMemo(() => {
    return videos.filter((v) => {
      if (pilarFilter !== "all" && v.pilar !== pilarFilter) return false;
      if (nivelFilter !== "all" && v.recommended_for_ins_cat !== nivelFilter) return false;
      if (statusFilter === "ready" && !v.youtube_url) return false;
      if (statusFilter === "pending" && v.youtube_url) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !v.video_code.toLowerCase().includes(q) &&
          !v.title.toLowerCase().includes(q) &&
          !(v.description ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [videos, pilarFilter, nivelFilter, statusFilter, search]);

  const groups = useMemo(() => {
    const acc: Record<string, AgentVideoRow[]> = {};
    for (const v of filtered) {
      const key = v.pilar ?? "sem_pilar";
      acc[key] = acc[key] ?? [];
      acc[key].push(v);
    }
    return acc;
  }, [filtered]);

  const total = videos.length;
  const ready = videos.filter((v) => v.youtube_url).length;
  const pending = total - ready;
  const progress = total > 0 ? Math.round((ready / total) * 100) : 0;

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (v: AgentVideoRow) => {
    setEditing(v);
    setDialogOpen(true);
  };

  return (
    <div className="container max-w-7xl py-6 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Video className="w-6 h-6 text-primary" />
              Vídeos do Agente
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Mapeamento JMP do Protocolo Destravamento — gestão dos vídeos contextuais por pilar, nível e momento.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Novo vídeo
          </Button>
        </div>

        {/* Card de progresso */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Produção dos vídeos</CardTitle>
            <CardDescription>
              {ready} de {total} vídeos com URL configurada ({progress}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {ready} prontos
              </span>
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> {pending} pendentes
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Filtros */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código, título ou descrição..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={pilarFilter === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setPilarFilter("all")}
            >
              Todos os pilares
            </Badge>
            {PILAR_OPTIONS.map((p) => (
              <Badge
                key={p}
                variant={pilarFilter === p ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setPilarFilter(p)}
              >
                {PILAR_LABELS[p]}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {NIVEIS.map((n) => (
              <Badge
                key={n}
                variant={nivelFilter === n ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setNivelFilter(n)}
              >
                {n === "all" ? "Todos os níveis" : `Nível ${n}`}
              </Badge>
            ))}
            <span className="w-px bg-border mx-1" />
            <Badge
              variant={statusFilter === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setStatusFilter("all")}
            >
              Todos
            </Badge>
            <Badge
              variant={statusFilter === "ready" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setStatusFilter("ready")}
            >
              Com URL
            </Badge>
            <Badge
              variant={statusFilter === "pending" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setStatusFilter("pending")}
            >
              Pendentes
            </Badge>
          </div>
        </div>

        {/* Lista agrupada */}
        {list.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum vídeo encontrado com esses filtros.
            </CardContent>
          </Card>
        ) : (
          Object.entries(groups).map(([pilar, items]) => (
            <Card key={pilar}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {PILAR_LABELS[pilar as keyof typeof PILAR_LABELS] ?? pilar}
                  <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.map((v) => (
                  <div
                    key={v.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors",
                      !v.active && "opacity-50"
                    )}
                  >
                    <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
                      {v.video_code}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{v.title}</p>
                        {v.youtube_url ? (
                          <Badge variant="outline" className="text-[10px] gap-1 border-green-500/50 text-green-700 dark:text-green-400">
                            <CheckCircle2 className="w-3 h-3" /> URL ok
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/50 text-amber-700 dark:text-amber-400">
                            <AlertCircle className="w-3 h-3" /> Pendente
                          </Badge>
                        )}
                        {v.obrigatorio && (
                          <Badge className="text-[10px]">Obrigatório</Badge>
                        )}
                        {v.recommended_for_ins_cat && (
                          <Badge variant="outline" className="text-[10px]">
                            {v.recommended_for_ins_cat}
                          </Badge>
                        )}
                        {v.recommended_for_dor_cat && (
                          <Badge variant="outline" className="text-[10px]">
                            {v.recommended_for_dor_cat}
                          </Badge>
                        )}
                        {v.momento && (
                          <Badge variant="outline" className="text-[10px]">
                            {MOMENTO_LABELS[v.momento as keyof typeof MOMENTO_LABELS] ?? v.momento}
                          </Badge>
                        )}
                      </div>
                      {v.gatilho && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {v.gatilho}
                        </p>
                      )}
                      {v.sessoes_alvo && v.sessoes_alvo.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Sessões: {v.sessoes_alvo.join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(v)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(v)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}

        <AgentVideoDialog open={dialogOpen} onOpenChange={setDialogOpen} video={editing} />

        <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover vídeo?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget?.video_code} — {deleteTarget?.title}. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (deleteTarget) await remove.mutateAsync(deleteTarget.id);
                  setDeleteTarget(null);
                }}
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
