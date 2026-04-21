import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle2, Lock } from "lucide-react";
import { YouTubePlayer } from "@/components/client/YouTubePlayer";

interface AgentVideo {
  id: string;
  video_code: string;
  title: string;
  description: string | null;
  youtube_url: string | null;
  duration_seconds: number | null;
}

interface MandatoryVideoModalProps {
  open: boolean;
  videos: AgentVideo[];
  milestoneTitle?: string;
  onAllWatched: () => void;
  onCancel?: () => void;
}

/**
 * Modal que bloqueia o início da sessão até que TODOS os vídeos sejam concluídos.
 * Usado em sessões de marco do Protocolo Destravamento.
 */
export const MandatoryVideoModal = ({
  open,
  videos,
  milestoneTitle = "Marco do Protocolo",
  onAllWatched,
  onCancel,
}: MandatoryVideoModalProps) => {
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const allWatched = videos.length > 0 && videos.every((v) => watchedIds.has(v.id));

  const handleWatch = (id: string) => {
    setWatchedIds((prev) => new Set(prev).add(id));
    setActiveVideoId(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel?.()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-primary" />
            <Badge variant="outline" className="text-xs">Marco obrigatório</Badge>
          </div>
          <DialogTitle>{milestoneTitle}</DialogTitle>
          <DialogDescription>
            Antes de iniciar esta sessão, assista aos vídeos abaixo. Eles preparam você para o que vem a seguir.
          </DialogDescription>
        </DialogHeader>

        {activeVideoId ? (
          <div className="space-y-3">
            {(() => {
              const v = videos.find((vv) => vv.id === activeVideoId);
              if (!v?.youtube_url) return <p className="text-sm text-muted-foreground">Vídeo indisponível.</p>;
              return (
                <>
                  <YouTubePlayer videoUrl={v.youtube_url} title={v.title} />
                  <Button onClick={() => handleWatch(v.id)} className="w-full gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Marcar como assistido
                  </Button>
                </>
              );
            })()}
          </div>
        ) : (
          <div className="space-y-2">
            {videos.map((v) => {
              const isWatched = watchedIds.has(v.id);
              return (
                <div
                  key={v.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isWatched ? "border-primary/30 bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isWatched ? "bg-primary/10" : "bg-muted"}`}>
                    {isWatched ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <Play className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{v.title}</p>
                    {v.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{v.description}</p>
                    )}
                  </div>
                  <Button
                    variant={isWatched ? "ghost" : "secondary"}
                    size="sm"
                    onClick={() => v.youtube_url ? setActiveVideoId(v.id) : handleWatch(v.id)}
                  >
                    {isWatched ? "Reassistir" : "Assistir"}
                  </Button>
                </div>
              );
            })}

            <Button
              onClick={onAllWatched}
              disabled={!allWatched}
              className="w-full mt-4"
              size="lg"
            >
              {allWatched
                ? "Iniciar sessão"
                : `Assista todos os vídeos (${watchedIds.size}/${videos.length})`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
