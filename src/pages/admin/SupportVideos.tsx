import { useState } from "react";
import { Plus, Search, Film, Edit, Trash2, Play, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

import { useSupportVideos, useDeleteSupportVideo } from "@/hooks/useSupportVideos";
import { SupportVideoDialog } from "@/components/admin/SupportVideoDialog";
import { SUPPORT_VIDEO_CATEGORIES } from "@/lib/schemas/supportVideoSchema";
import { cn } from "@/lib/utils";

const extractYouTubeId = (url: string): string | null => {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/);
  return m?.[1] ?? null;
};

const extractVimeoId = (url: string): string | null => {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m?.[1] ?? null;
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const getCategoryLabel = (cat: string) =>
  SUPPORT_VIDEO_CATEGORIES.find((c) => c.value === cat)?.label || cat;

export default function SupportVideos() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<any>(null);
  const [deletingVideo, setDeletingVideo] = useState<any>(null);

  const { data: videos = [], isLoading } = useSupportVideos({ search, category });
  const deleteMutation = useDeleteSupportVideo();

  const openCreate = () => {
    setEditingVideo(null);
    setDialogOpen(true);
  };

  const openEdit = (v: any) => {
    setEditingVideo(v);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingVideo) return;
    await deleteMutation.mutateAsync(deletingVideo);
    setDeletingVideo(null);
  };

  const renderPlayer = (v: any) => {
    if (v.source === "youtube") {
      const id = extractYouTubeId(v.video_url);
      if (id)
        return (
          <iframe
            src={`https://www.youtube.com/embed/${id}?autoplay=1`}
            className="w-full aspect-video rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
    }
    if (v.source === "vimeo") {
      const id = extractVimeoId(v.video_url);
      if (id)
        return (
          <iframe
            src={`https://player.vimeo.com/video/${id}?autoplay=1`}
            className="w-full aspect-video rounded-lg"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        );
    }
    return (
      <video src={v.video_url} controls autoPlay className="w-full aspect-video rounded-lg" />
    );
  };

  return (
    <div className="container max-w-7xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Film className="w-7 h-7 text-primary" />
            Vídeos de Apoio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Biblioteca de vídeos educacionais, motivacionais e de recuperação para os clientes.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Vídeo
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={!category ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setCategory(undefined)}
          >
            Todos
          </Badge>
          {SUPPORT_VIDEO_CATEGORIES.map((c) => (
            <Badge
              key={c.value}
              variant={category === c.value ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-video rounded-lg" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Film className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">
              {search || category
                ? "Nenhum vídeo encontrado com esses filtros."
                : "Nenhum vídeo cadastrado ainda. Comece criando seu primeiro vídeo de apoio."}
            </p>
            {!search && !category && (
              <Button onClick={openCreate} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Criar primeiro vídeo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => (
            <Card
              key={v.id}
              className={cn(
                "overflow-hidden transition-all hover:shadow-lg group",
                !v.active && "opacity-60"
              )}
            >
              <div
                className="relative aspect-video bg-muted cursor-pointer"
                onClick={() => setPreviewVideo(v)}
              >
                {v.thumbnail_url ? (
                  <img
                    src={v.thumbnail_url}
                    alt={v.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <Film className="w-12 h-12 text-primary/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-12 h-12 text-white" />
                </div>
                {v.duration_seconds && (
                  <Badge className="absolute bottom-2 right-2 bg-black/70 text-white border-0">
                    {formatDuration(v.duration_seconds)}
                  </Badge>
                )}
                {!v.active && (
                  <Badge variant="destructive" className="absolute top-2 left-2">
                    Inativo
                  </Badge>
                )}
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold line-clamp-2 flex-1">{v.title}</h3>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {getCategoryLabel(v.category)}
                  </Badge>
                </div>
                {v.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{v.description}</p>
                )}
                {v.tags && v.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {v.tags.slice(0, 3).map((t: string) => (
                      <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">
                        {t}
                      </Badge>
                    ))}
                    {v.tags.length > 3 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        +{v.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => openEdit(v)}
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    Editar
                  </Button>
                  {v.source !== "upload" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(v.video_url, "_blank")}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeletingVideo(v)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de criar/editar */}
      <SupportVideoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        video={editingVideo}
      />

      {/* Preview */}
      <Dialog open={!!previewVideo} onOpenChange={(o) => !o && setPreviewVideo(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewVideo?.title}</DialogTitle>
          </DialogHeader>
          {previewVideo && renderPlayer(previewVideo)}
          {previewVideo?.description && (
            <p className="text-sm text-muted-foreground">{previewVideo.description}</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <AlertDialog open={!!deletingVideo} onOpenChange={(o) => !o && setDeletingVideo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover vídeo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O vídeo "{deletingVideo?.title}" será removido
              permanentemente
              {deletingVideo?.source === "upload" && ", incluindo o arquivo do armazenamento"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
