import { supabase } from "@/integrations/supabase/client";

export const uploadExerciseMedia = async (
  file: File,
  userId: string
): Promise<string> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("exercise-media")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("exercise-media").getPublicUrl(data.path);

  return publicUrl;
};

export const deleteExerciseMedia = async (url: string): Promise<void> => {
  const path = url.split("/exercise-media/")[1];
  if (!path) return;

  const { error } = await supabase.storage.from("exercise-media").remove([path]);

  if (error) throw error;
};
