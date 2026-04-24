import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import type { SupportVideoFormParsed } from "@/lib/schemas/supportVideoSchema";

interface SupportVideoFilters {
  category?: string;
  search?: string;
  activeOnly?: boolean;
}

export const useSupportVideos = (filters?: SupportVideoFilters) => {
  return useQuery({
    queryKey: ["support-videos", filters],
    queryFn: async () => {
      let query = supabase
        .from("support_videos")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.category) {
        query = query.eq("category", filters.category as any);
      }
      if (filters?.activeOnly) {
        query = query.eq("active", true);
      }
      if (filters?.search) {
        const term = `%${filters.search}%`;
        query = query.or(`title.ilike.${term},description.ilike.${term}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

const uploadVideoFile = async (file: File, userId: string): Promise<string> => {
  const ext = file.name.split(".").pop() || "mp4";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from("support-videos")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("support-videos").getPublicUrl(path);
  return data.publicUrl;
};

const removeStorageFile = async (publicUrl: string) => {
  const marker = "/support-videos/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.substring(idx + marker.length);
  await supabase.storage.from("support-videos").remove([path]);
};

interface MutationPayload {
  data: SupportVideoFormParsed;
  videoFile?: File;
  thumbnailFile?: File;
}

export const useCreateSupportVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ data, videoFile, thumbnailFile }: MutationPayload) => {
      if (!user) throw new Error("Usuário não autenticado");

      let videoUrl = data.video_url;
      let thumbnailUrl = data.thumbnail_url || null;

      if (data.source === "upload" && videoFile) {
        videoUrl = await uploadVideoFile(videoFile, user.id);
      }
      if (thumbnailFile) {
        thumbnailUrl = await uploadVideoFile(thumbnailFile, user.id);
      }

      const insertData: any = {
        title: data.title,
        description: data.description || null,
        category: data.category,
        source: data.source,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl || null,
        duration_seconds: data.duration_seconds || null,
        tags: data.tags || [],
        suggested_for_dor_cat: data.suggested_for_dor_cat || null,
        suggested_for_ins_cat: data.suggested_for_ins_cat || null,
        suggested_for_exercise_group: data.suggested_for_exercise_group || null,
        suggested_when: data.suggested_when || null,
        active: data.active,
        created_by: user.id,
      };

      const { data: created, error } = await supabase
        .from("support_videos")
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-videos"] });
      toast({ title: "Vídeo de apoio criado com sucesso" });
    },
    onError: (e: any) =>
      toast({ title: "Erro ao criar vídeo", description: e.message, variant: "destructive" }),
  });
};

export const useUpdateSupportVideo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      videoFile,
      thumbnailFile,
    }: MutationPayload & { id: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      let videoUrl = data.video_url;
      let thumbnailUrl = data.thumbnail_url || null;

      if (data.source === "upload" && videoFile) {
        videoUrl = await uploadVideoFile(videoFile, user.id);
      }
      if (thumbnailFile) {
        thumbnailUrl = await uploadVideoFile(thumbnailFile, user.id);
      }

      const updateData: any = {
        title: data.title,
        description: data.description || null,
        category: data.category,
        source: data.source,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl || null,
        duration_seconds: data.duration_seconds || null,
        tags: data.tags || [],
        suggested_for_dor_cat: data.suggested_for_dor_cat || null,
        suggested_for_ins_cat: data.suggested_for_ins_cat || null,
        suggested_for_exercise_group: data.suggested_for_exercise_group || null,
        suggested_when: data.suggested_when || null,
        active: data.active,
      };

      const { data: updated, error } = await supabase
        .from("support_videos")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-videos"] });
      toast({ title: "Vídeo atualizado" });
    },
    onError: (e: any) =>
      toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
  });
};

export const useDeleteSupportVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (video: { id: string; source: string; video_url: string }) => {
      if (video.source === "upload") {
        await removeStorageFile(video.video_url).catch(() => {});
      }
      const { error } = await supabase.from("support_videos").delete().eq("id", video.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-videos"] });
      toast({ title: "Vídeo removido" });
    },
    onError: (e: any) =>
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" }),
  });
};
