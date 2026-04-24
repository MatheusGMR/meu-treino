import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  supportVideoSchema,
  type SupportVideoFormValues,
  SUPPORT_VIDEO_CATEGORIES,
  SUPPORT_VIDEO_SOURCES,
  SUPPORT_VIDEO_MOMENTS,
} from "@/lib/schemas/supportVideoSchema";
import {
  useCreateSupportVideo,
  useUpdateSupportVideo,
} from "@/hooks/useSupportVideos";

const DOR_CATS = ["D0", "D1", "D2", "D3"];
const INS_CATS = ["I1", "I2", "I3"];
const EXERCISE_GROUPS = [
  "Peito",
  "Costas",
  "Pernas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Glúteos",
  "Panturrilha",
  "Quadríceps",
  "Posterior",
  "Lombar",
  "Abdômen",
  "Outro",
];

const NONE = "__none__";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video?: any;
}

const extractYouTubeId = (url: string): string | null => {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/);
  return m?.[1] ?? null;
};

export const SupportVideoDialog = ({ open, onOpenChange, video }: Props) => {
  const [videoFile, setVideoFile] = useState<File | undefined>();
  const [thumbnailFile, setThumbnailFile] = useState<File | undefined>();
  const [tagInput, setTagInput] = useState("");
  const [smartOpen, setSmartOpen] = useState(false);

  const createMutation = useCreateSupportVideo();
  const updateMutation = useUpdateSupportVideo();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const form = useForm<SupportVideoFormValues>({
    resolver: zodResolver(supportVideoSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "educacional",
      source: "youtube",
      video_url: "",
      thumbnail_url: "",
      duration_seconds: undefined,
      tags: [],
      suggested_for_dor_cat: null,
      suggested_for_ins_cat: null,
      suggested_for_exercise_group: null,
      suggested_when: null,
      active: true,
    },
  });

  useEffect(() => {
    if (open && video) {
      form.reset({
        title: video.title,
        description: video.description || "",
        category: video.category,
        source: video.source,
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url || "",
        duration_seconds: video.duration_seconds || undefined,
        tags: video.tags || [],
        suggested_for_dor_cat: video.suggested_for_dor_cat,
        suggested_for_ins_cat: video.suggested_for_ins_cat,
        suggested_for_exercise_group: video.suggested_for_exercise_group,
        suggested_when: video.suggested_when,
        active: video.active,
      });
      setSmartOpen(
        Boolean(
          video.suggested_for_dor_cat ||
            video.suggested_for_ins_cat ||
            video.suggested_for_exercise_group ||
            video.suggested_when
        )
      );
    } else if (open) {
      form.reset();
      setVideoFile(undefined);
      setThumbnailFile(undefined);
      setTagInput("");
      setSmartOpen(false);
    }
  }, [open, video]);

  const source = form.watch("source");
  const tags = form.watch("tags") || [];
  const videoUrl = form.watch("video_url");
  const thumbnailUrl = form.watch("thumbnail_url");

  const handleAddTag = () => {
    const v = tagInput.trim();
    if (!v) return;
    if (tags.includes(v)) return;
    form.setValue("tags", [...tags, v]);
    setTagInput("");
  };

  const handleRemoveTag = (t: string) => {
    form.setValue(
      "tags",
      tags.filter((x) => x !== t)
    );
  };

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      alert("Arquivo muito grande. Máximo: 100MB");
      return;
    }
    setVideoFile(file);
    form.setValue("video_url", file.name);
  };

  const handleThumbFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Imagem muito grande. Máximo: 5MB");
      return;
    }
    setThumbnailFile(file);
  };

  // Auto thumbnail YouTube
  const handleYouTubeUrlChange = (url: string) => {
    form.setValue("video_url", url);
    if (!thumbnailUrl) {
      const id = extractYouTubeId(url);
      if (id) {
        form.setValue("thumbnail_url", `https://img.youtube.com/vi/${id}/hqdefault.jpg`);
      }
    }
  };

  const onSubmit = async (values: SupportVideoFormValues) => {
    const payload: any = {
      ...values,
      suggested_for_dor_cat: values.suggested_for_dor_cat || null,
      suggested_for_ins_cat: values.suggested_for_ins_cat || null,
      suggested_for_exercise_group: values.suggested_for_exercise_group || null,
      suggested_when: values.suggested_when || null,
    };

    if (video?.id) {
      await updateMutation.mutateAsync({
        id: video.id,
        data: payload,
        videoFile,
        thumbnailFile,
      });
    } else {
      await createMutation.mutateAsync({
        data: payload,
        videoFile,
        thumbnailFile,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{video ? "Editar Vídeo de Apoio" : "Novo Vídeo de Apoio"}</DialogTitle>
          <DialogDescription>
            Vídeos disponíveis para clientes (educacional, motivacional, recuperação etc).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Como ativar o core" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="O que este vídeo ensina ou inspira..."
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SUPPORT_VIDEO_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fonte</FormLabel>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue("video_url", "");
                        setVideoFile(undefined);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SUPPORT_VIDEO_SOURCES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Video URL / Upload */}
            {source === "upload" ? (
              <FormItem>
                <FormLabel>Arquivo de vídeo</FormLabel>
                {videoFile || (video?.source === "upload" && videoUrl) ? (
                  <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                    <span className="text-sm truncate">
                      {videoFile?.name || videoUrl}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setVideoFile(undefined);
                        form.setValue("video_url", "");
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <Label htmlFor="sv-file" className="cursor-pointer text-primary hover:underline">
                      Selecionar arquivo
                    </Label>
                    <input
                      id="sv-file"
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={handleVideoFile}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground mt-1">MP4, WebM, MOV até 100MB</p>
                  </div>
                )}
                {form.formState.errors.video_url && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.video_url.message}
                  </p>
                )}
              </FormItem>
            ) : (
              <FormField
                control={form.control}
                name="video_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do vídeo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          source === "youtube"
                            ? "https://youtube.com/watch?v=..."
                            : "https://vimeo.com/..."
                        }
                        {...field}
                        onChange={(e) =>
                          source === "youtube"
                            ? handleYouTubeUrlChange(e.target.value)
                            : field.onChange(e.target.value)
                        }
                      />
                    </FormControl>
                    {source === "youtube" && (
                      <FormDescription>
                        Miniatura é detectada automaticamente do YouTube.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration_seconds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (segundos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 180"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Miniatura (opcional)</FormLabel>
                {thumbnailFile ? (
                  <div className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                    <span className="text-xs truncate">{thumbnailFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setThumbnailFile(undefined)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbFile}
                    className="text-xs"
                  />
                )}
              </FormItem>
            </div>

            {/* Tags */}
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                  Adicionar
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((t) => (
                    <Badge key={t} variant="secondary" className="gap-1">
                      {t}
                      <button type="button" onClick={() => handleRemoveTag(t)}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </FormItem>

            {/* Sugestão Inteligente */}
            <Collapsible open={smartOpen} onOpenChange={setSmartOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="w-full">
                  {smartOpen ? "Ocultar" : "Configurar"} Sugestão Inteligente
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <p className="text-xs text-muted-foreground">
                  Defina quando o sistema deve sugerir automaticamente este vídeo ao cliente.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="suggested_for_dor_cat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Categoria de dor</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                          value={field.value || NONE}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={NONE}>—</SelectItem>
                            {DOR_CATS.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="suggested_for_ins_cat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Categoria de insegurança</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                          value={field.value || NONE}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={NONE}>—</SelectItem>
                            {INS_CATS.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="suggested_for_exercise_group"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Grupo muscular</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                          value={field.value || NONE}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={NONE}>—</SelectItem>
                            {EXERCISE_GROUPS.map((g) => (
                              <SelectItem key={g} value={g}>
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="suggested_when"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Momento</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                          value={field.value || NONE}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={NONE}>—</SelectItem>
                            {SUPPORT_VIDEO_MOMENTS.map((m) => (
                              <SelectItem key={m.value} value={m.value}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Ativo</FormLabel>
                    <FormDescription className="text-xs">
                      Vídeos inativos não são exibidos aos clientes.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {video ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
