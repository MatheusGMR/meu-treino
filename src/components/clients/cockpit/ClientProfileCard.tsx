import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Target, Clock, Calendar, AlertTriangle, Moon, Activity } from "lucide-react";

interface ClientProfileCardProps {
  primaryGoal: string | null;
  secondaryGoal: string | null;
  level: string;
  timeAvailable: string;
  suggestedFrequency: string;
  pains: string[];
  restrictions: string | null;
  stress: string | null;
  sleep: string | null;
  fatigueAlert: {
    level: 'high' | 'moderate';
    message: string;
  } | null;
  clientAnamnesis?: any;
}

export const ClientProfileCard = ({ 
  primaryGoal, 
  secondaryGoal, 
  level, 
  timeAvailable, 
  suggestedFrequency,
  pains,
  restrictions,
  stress,
  sleep,
  fatigueAlert,
  clientAnamnesis
}: ClientProfileCardProps) => {
  // Calcular IMC (priorizar dados persistidos)
  const calcularIMC = () => {
    if (clientAnamnesis?.imc_calculado && clientAnamnesis?.imc_categoria) {
      return {
        valor: clientAnamnesis.imc_calculado.toFixed(1),
        categoria: clientAnamnesis.imc_categoria
      };
    }
    
    if (clientAnamnesis?.peso_kg && clientAnamnesis?.altura_cm) {
      const peso = clientAnamnesis.peso_kg;
      const altura = clientAnamnesis.altura_cm;
      const imc = peso / Math.pow(altura / 100, 2);
      const categoria = 
        imc < 18.5 ? 'Abaixo do peso' :
        imc < 25 ? 'Peso normal' :
        imc < 30 ? 'Sobrepeso' : 'Obesidade';
      return { valor: imc.toFixed(1), categoria };
    }
    
    return null;
  };

  const imc = calcularIMC();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Perfil do Cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {/* IMC e Nível */}
        {imc && (
          <div className="space-y-1 pb-2 border-b">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium">Composição:</span>
            </div>
            <p className="text-muted-foreground pl-5">
              IMC: {imc.valor} ({imc.categoria})
              {clientAnamnesis?.nivel_experiencia && (
                <> • {clientAnamnesis.nivel_experiencia}</>
              )}
            </p>
          </div>
        )}

        {/* Objetivos */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium">Objetivo:</span>
            <Badge variant="secondary">{primaryGoal}</Badge>
            {secondaryGoal && <Badge variant="outline" className="text-xs">+{secondaryGoal}</Badge>}
          </div>
        </div>

        {/* Nível e Tempo */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Nível:</span>
            <span className="ml-1 font-medium">{level}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Tempo:</span>
            <span className="ml-1 font-medium">{timeAvailable}</span>
          </div>
        </div>

        {/* Frequência sugerida */}
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Frequência:</span>
          <span className="font-medium">{suggestedFrequency}</span>
        </div>

        {/* Dores/Lesões */}
        {pains.length > 0 && (
          <div className="space-y-1 pt-2 border-t">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-medium">Dores/Lesões:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {pains.map((pain, idx) => (
                <Badge key={idx} variant="destructive" className="text-xs">{pain}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Restrição Médica */}
        {restrictions && restrictions !== 'Não' && (
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Restrição médica: {restrictions}</span>
          </div>
        )}

        {/* Estresse e Sono */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Estresse:</span>
            <Badge variant={stress === 'Alto' ? 'destructive' : 'outline'} className="text-xs">
              {stress}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <Moon className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Sono:</span>
            <Badge 
              variant={sleep?.includes('Menos de 5') || sleep?.includes('5 a 6') ? 'destructive' : 'outline'}
              className="text-xs"
            >
              {sleep}
            </Badge>
          </div>
        </div>

        {/* Alerta de Fadiga */}
        {fatigueAlert && (
          <Alert variant={fatigueAlert.level === 'high' ? 'destructive' : 'default'} className="py-2">
            <AlertDescription className="text-xs">{fatigueAlert.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
