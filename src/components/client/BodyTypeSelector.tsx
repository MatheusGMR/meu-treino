import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { bodyTypeFallbackImages } from "./BodyTypeFallbackImages";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const BODY_TYPE_LABELS: Record<number, string> = {
  1: "Magro",
  2: "Atlético",
  3: "Forte",
  4: "Sobrepeso",
  5: "Obeso"
};

interface BodyTypeSelectorProps {
  gender: string;
  value: number | null;
  onChange: (value: number) => void;
}

export function BodyTypeSelector({ gender, value, onChange }: BodyTypeSelectorProps) {
  const [images, setImages] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    if (!gender) {
      setLoading(false);
      return;
    }

    loadStaticImages();
  }, [gender]);

  const useFallbackImages = () => {
    console.log("Using fallback SVG images for body types");
    setImages(bodyTypeFallbackImages);
    setUsingFallback(true);
    setLoading(false);
  };

  const loadStaticImages = async () => {
    setLoading(true);
    setError(null);
    const loadedImages: Record<number, string> = {};

    try {
      const genderFolder = gender === "Masculino" ? "male" : "female";
      
      // Load all 5 images from storage
      for (let i = 1; i <= 5; i++) {
        const { data } = supabase.storage
          .from('body-type-images')
          .getPublicUrl(`${genderFolder}/type-${i}.png`);
        
        loadedImages[i] = data.publicUrl;
      }

      setImages(loadedImages);
      setUsingFallback(false);
    } catch (err) {
      console.error('Error loading body type images from storage:', err);
      useFallbackImages();
      
      toast({
        title: "Usando visualização simplificada",
        description: "As imagens de referência não puderam ser carregadas.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!gender) {
    return (
      <div className="text-sm text-muted-foreground">
        Por favor, selecione o gênero primeiro para visualizar os tipos corporais.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[3/4] w-full rounded-lg" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-destructive">{error}</p>
        <button
          onClick={useFallbackImages}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Usar Visualização Simplificada
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {usingFallback && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Usando visualização simplificada dos tipos corporais. As imagens funcionam perfeitamente para completar a anamnese.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }, (_, i) => i + 1).map((bodyType) => (
          <button
            key={bodyType}
            type="button"
            onClick={() => onChange(bodyType)}
            className={cn(
              "group relative flex flex-col items-center p-2 rounded-lg border-2 transition-all hover:shadow-md",
              value === bodyType
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="relative w-full aspect-[3/4] rounded-md overflow-hidden bg-muted">
              {images[bodyType] ? (
                <img
                  src={images[bodyType]}
                  alt={`Tipo corporal ${bodyType}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Skeleton className="w-full h-full" />
              )}
              {value === bodyType && (
                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    ✓
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2 text-center">
              <div className="font-semibold text-sm">{bodyType}</div>
              <div className="text-xs text-muted-foreground">
                {BODY_TYPE_LABELS[bodyType]}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
