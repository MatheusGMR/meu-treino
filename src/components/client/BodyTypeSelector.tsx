import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { bodyTypeFallbackImages } from "./BodyTypeFallbackImages";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const BODY_TYPE_LABELS: Record<number, string> = {
  1: "Muito Magro",
  2: "Magro",
  3: "Atlético Magro",
  4: "Atlético",
  5: "Atlético Forte",
  6: "Forte com Volume",
  7: "Sobrepeso",
  8: "Obeso Moderado",
  9: "Obeso"
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

    const cacheKey = `bodyType_${gender}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      const parsedCache = JSON.parse(cached);
      setImages(parsedCache);
      setUsingFallback(parsedCache.isFallback || false);
      setLoading(false);
      return;
    }

    generateImages();
  }, [gender]);

  const useFallbackImages = () => {
    console.log("Using fallback SVG images for body types");
    setImages(bodyTypeFallbackImages);
    setUsingFallback(true);
    setLoading(false);
    
    // Cache fallback images
    const cacheKey = `bodyType_${gender}`;
    sessionStorage.setItem(cacheKey, JSON.stringify({ ...bodyTypeFallbackImages, isFallback: true }));
  };

  const generateImages = async () => {
    if (!gender) return;

    setLoading(true);
    setError(null);
    const generatedImages: Record<number, string> = {};

    try {
      // Generate images for all 9 body types in parallel
      const promises = Array.from({ length: 9 }, (_, i) => i + 1).map(async (bodyType) => {
        try {
          const { data, error: funcError } = await supabase.functions.invoke('generate-body-type-images', {
            body: { gender, bodyType }
          });

          if (funcError) throw funcError;
          if (!data?.imageUrl) throw new Error('No image URL returned');

          generatedImages[bodyType] = data.imageUrl;
        } catch (err) {
          console.error(`Error generating image for body type ${bodyType}:`, err);
          throw err;
        }
      });

      await Promise.all(promises);

      // Cache the AI-generated results
      const cacheKey = `bodyType_${gender}`;
      sessionStorage.setItem(cacheKey, JSON.stringify({ ...generatedImages, isFallback: false }));
      
      setImages(generatedImages);
      setUsingFallback(false);
    } catch (err) {
      console.error('Error generating body type images, using fallback:', err);
      
      // Use fallback images instead of showing error
      useFallbackImages();
      
      toast({
        title: "Usando visualização simplificada",
        description: "As imagens detalhadas não puderam ser carregadas, mas você ainda pode selecionar seu tipo corporal.",
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
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
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
          onClick={() => {
            setError(null);
            useFallbackImages();
          }}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
        >
          Usar Visualização Simplificada
        </button>
        <button
          onClick={generateImages}
          className="ml-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Tentar Novamente com IA
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
      
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((bodyType) => (
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
