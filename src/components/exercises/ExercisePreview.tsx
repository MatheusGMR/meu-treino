import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

interface ExercisePreviewProps {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExercisePreview = ({
  exercise,
  open,
  onOpenChange,
}: ExercisePreviewProps) => {
  if (!exercise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{exercise.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Thumbnail do exercício */}
          {exercise.thumbnail_url && (
            <div className="w-full aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={exercise.thumbnail_url}
                alt={exercise.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Tipo</p>
              <Badge variant="outline">{exercise.exercise_type}</Badge>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-2">Grupo Muscular</p>
              <Badge variant="outline">{exercise.exercise_group}</Badge>
            </div>
          </div>

          {exercise.level && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Nível</p>
              <Badge>{exercise.level}</Badge>
            </div>
          )}

          {exercise.primary_muscle && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Músculo Primário</p>
              <Badge variant="secondary">{exercise.primary_muscle}</Badge>
            </div>
          )}

          {exercise.secondary_muscle && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Músculo Secundário</p>
              <Badge variant="secondary">{exercise.secondary_muscle}</Badge>
            </div>
          )}

          {/* Informações Técnicas */}
          {(exercise.biomechanical_class || exercise.dominant_movement || exercise.impact_level) && (
            <div className="border-t pt-4">
              <p className="text-sm font-semibold mb-3">Informações Técnicas</p>
              <div className="grid gap-3">
                {exercise.biomechanical_class && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Classe Biomecânica</p>
                    <Badge variant="outline" className="text-xs">{exercise.biomechanical_class}</Badge>
                  </div>
                )}
                {exercise.dominant_movement && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Movimento Dominante</p>
                    <Badge variant="outline" className="text-xs">{exercise.dominant_movement}</Badge>
                  </div>
                )}
                {exercise.impact_level && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Nível de Impacto</p>
                    <Badge variant="outline" className="text-xs">{exercise.impact_level}</Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Badges */}
          <div className="flex gap-2 flex-wrap">
            {exercise.is_new && (
              <Badge variant="secondary" className="text-xs">✨ Novo</Badge>
            )}
            {exercise.confidence_score && (
              <Badge variant="outline" className="text-xs">
                Confiança: {(exercise.confidence_score * 100).toFixed(0)}%
              </Badge>
            )}
            {exercise.review_status === 'pending' && (
              <Badge variant="destructive" className="text-xs">⏳ Pendente Revisão</Badge>
            )}
          </div>

          {/* Descrição */}
          {(exercise.short_description || exercise.long_description) && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Descrição</p>
              <p className="text-sm">
                {exercise.short_description || exercise.long_description}
              </p>
            </div>
          )}

          {exercise.equipment && exercise.equipment.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Equipamentos Necessários</p>
              <div className="flex gap-2 flex-wrap">
                {exercise.equipment.map((eq: string, idx: number) => (
                  <Badge key={`${eq}-${idx}`} variant="secondary" className="text-xs">
                    {eq}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Dicas de Execução */}
          {exercise.coaching_cues && exercise.coaching_cues.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Dicas de Execução</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {exercise.coaching_cues.map((cue: string, idx: number) => (
                  <li key={idx} className="text-muted-foreground">{cue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Erros Comuns */}
          {exercise.common_mistakes && exercise.common_mistakes.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Erros Comuns</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {exercise.common_mistakes.map((mistake: string, idx: number) => (
                  <li key={idx} className="text-amber-600 text-xs">{mistake}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Variações */}
          {exercise.variations && exercise.variations.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Variações</p>
              <div className="flex gap-2 flex-wrap">
                {exercise.variations.map((variation: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {variation}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Volume Sugerido */}
          {exercise.suggested_volume && (
            <div className="border-t pt-4">
              <p className="text-sm font-semibold mb-2">Configuração Recomendada</p>
              <div className="bg-muted p-3 rounded-lg">
                <pre className="text-xs overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(exercise.suggested_volume, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {exercise.video_url && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Vídeo</p>
              <a
                href={exercise.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                Ver vídeo demonstrativo →
              </a>
            </div>
          )}

          {exercise.contraindication && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-destructive mb-1">
                    Contraindicação
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {exercise.contraindication}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
