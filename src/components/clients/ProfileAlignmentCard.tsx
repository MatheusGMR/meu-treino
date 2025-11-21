import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";
import { motion } from "framer-motion";

interface ProfileAlignmentCardProps {
  profileName: string | null;
  volumeStatus: 'below' | 'optimal' | 'above' | 'excessive' | null;
  volumePercentage: number | null;
  intensityAligned: boolean;
  currentIntensity: string;
  recommendedIntensity: string | null;
  goalAlignment: number;
  primaryGoal: string | null;
  riskFactors: string[];
}

export const ProfileAlignmentCard = ({
  profileName,
  volumeStatus,
  volumePercentage,
  intensityAligned,
  currentIntensity,
  recommendedIntensity,
  goalAlignment,
  primaryGoal,
  riskFactors,
}: ProfileAlignmentCardProps) => {
  if (!profileName) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Info className="w-4 h-4" />
          <p>Perfil de anamnese não disponível</p>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">Alinhamento com Perfil</h4>
          <Badge variant="outline">{profileName}</Badge>
        </div>

        <div className="space-y-3">
          {/* Volume Status */}
          {volumeStatus && volumePercentage !== null && (
            <div className="flex items-start gap-2 text-xs">
              {volumeStatus === 'optimal' ? (
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 mt-0.5 text-yellow-500" />
              )}
              <div className="flex-1">
                <p className="font-medium">Volume Semanal</p>
                <p className="text-muted-foreground">
                  {volumeStatus === 'optimal' && 'Adequado para o perfil'}
                  {volumeStatus === 'below' && `${Math.abs(volumePercentage - 100).toFixed(0)}% abaixo do recomendado`}
                  {volumeStatus === 'above' && `${(volumePercentage - 100).toFixed(0)}% acima do recomendado`}
                  {volumeStatus === 'excessive' && `Excessivo: ${(volumePercentage - 100).toFixed(0)}% acima do limite`}
                </p>
              </div>
            </div>
          )}

          {/* Intensity Alignment */}
          {recommendedIntensity && (
            <div className="flex items-start gap-2 text-xs">
              {intensityAligned ? (
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 mt-0.5 text-yellow-500" />
              )}
              <div className="flex-1">
                <p className="font-medium">Intensidade</p>
                <p className="text-muted-foreground">
                  {intensityAligned 
                    ? `Alinhada: ${currentIntensity}`
                    : `Perfil recomenda ${recommendedIntensity}, treino está ${currentIntensity}`}
                </p>
              </div>
            </div>
          )}

          {/* Goal Alignment */}
          {primaryGoal && (
            <div className="flex items-start gap-2 text-xs">
              {goalAlignment >= 50 ? (
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 mt-0.5 text-yellow-500" />
              )}
              <div className="flex-1">
                <p className="font-medium">Alinhamento com Objetivo</p>
                <p className="text-muted-foreground">
                  {goalAlignment >= 50 
                    ? `${goalAlignment.toFixed(0)}% focado em ${primaryGoal}`
                    : `Apenas ${goalAlignment.toFixed(0)}% focado em ${primaryGoal}`}
                </p>
              </div>
            </div>
          )}

          {/* Risk Factors */}
          {riskFactors.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs font-medium mb-1">Fatores de Risco:</p>
              <div className="space-y-1">
                {riskFactors.slice(0, 2).map((factor, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="text-yellow-500">⚠️</span>
                    <span>{factor}</span>
                  </div>
                ))}
                {riskFactors.length > 2 && (
                  <p className="text-xs text-muted-foreground pl-5">
                    +{riskFactors.length - 2} outros fatores
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
