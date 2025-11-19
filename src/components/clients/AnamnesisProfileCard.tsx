import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Target, Activity, Heart, Utensils, Brain } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type AnamnesisProfile = Tables<"anamnesis_profiles">;
type AnamnesisRecommendation = Tables<"anamnesis_recommendations">;

interface AnamnesisProfileCardProps {
  profile: AnamnesisProfile & { recommendations: AnamnesisRecommendation[] };
  confidenceScore?: number;
}

export const AnamnesisProfileCard = ({ profile, confidenceScore }: AnamnesisProfileCardProps) => {
  const categoryIcons: Record<string, typeof Target> = {
    treino: Target,
    intensidade: Activity,
    medico: Heart,
    nutricao: Utensils,
    comportamental: Brain,
  };

  const priorityColors: Record<string, string> = {
    alta: "destructive",
    media: "default",
    baixa: "secondary",
  };

  const groupedRecommendations = profile.recommendations.reduce((acc, rec) => {
    if (!acc[rec.category]) {
      acc[rec.category] = [];
    }
    acc[rec.category].push(rec);
    return acc;
  }, {} as Record<string, AnamnesisRecommendation[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Perfil Calculado</CardTitle>
          <Badge variant="outline" className="text-lg">
            Perfil {profile.profile_number}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">{profile.name}</h3>
          <p className="text-muted-foreground">{profile.description}</p>
          {confidenceScore && (
            <p className="text-sm text-muted-foreground mt-2">
              Confiança: {(confidenceScore * 100).toFixed(0)}%
            </p>
          )}
        </div>

        <div>
          <h4 className="font-medium mb-2">Estratégia</h4>
          <p className="text-muted-foreground">{profile.strategy}</p>
        </div>

        {profile.risk_factors && profile.risk_factors.length > 0 && (
          <Alert variant="destructive">
            <AlertTitle>Fatores de Risco</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {profile.risk_factors.map((risk, index) => (
                  <li key={index}>{risk}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {profile.recommended_training_type && profile.recommended_training_type.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Tipo de treino</p>
              <div className="flex flex-wrap gap-2">
                {profile.recommended_training_type.map((type, index) => (
                  <Badge key={index} variant="secondary">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {profile.recommended_intensity && (
            <div>
              <p className="text-sm font-medium mb-2">Intensidade</p>
              <Badge variant="outline">{profile.recommended_intensity}</Badge>
            </div>
          )}
          {profile.recommended_frequency && (
            <div>
              <p className="text-sm font-medium mb-2">Frequência</p>
              <Badge variant="outline">{profile.recommended_frequency}</Badge>
            </div>
          )}
        </div>

        {profile.recommendations && profile.recommendations.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Recomendações Específicas</h4>
            {Object.entries(groupedRecommendations).map(([category, recs]) => {
              const Icon = categoryIcons[category.toLowerCase()] || Target;
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <h5 className="font-medium capitalize">{category}</h5>
                  </div>
                  <ul className="space-y-2 ml-6">
                    {recs.map((rec) => (
                      <li key={rec.id} className="flex items-start gap-2">
                        <Badge
                          variant={priorityColors[rec.priority.toLowerCase()] as any}
                          className="mt-0.5"
                        >
                          {rec.priority}
                        </Badge>
                        <span className="text-sm text-muted-foreground flex-1">
                          {rec.recommendation}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
