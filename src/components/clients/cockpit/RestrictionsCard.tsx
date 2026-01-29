import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { XCircle, CheckCircle, AlertTriangle } from "lucide-react";

interface RestrictionsCardProps {
  blocked: string[];
  recommended: string[];
  warnings: string[];
}

export const RestrictionsCard = ({ blocked, recommended, warnings }: RestrictionsCardProps) => {
  const hasContent = blocked.length > 0 || recommended.length > 0 || warnings.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Riscos e Restrições</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {!hasContent ? (
          <p className="text-muted-foreground text-center py-4">
            ✅ Nenhuma restrição identificada para este cliente
          </p>
        ) : (
          <>
            {/* Exercícios Bloqueados */}
            {blocked.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-destructive font-medium">
                  <XCircle className="w-4 h-4" />
                  <span>Exercícios Bloqueados</span>
                </div>
                <ul className="space-y-1 pl-6">
                  {blocked.map((ex, idx) => (
                    <li key={idx} className="text-muted-foreground">🚫 {ex}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Exercícios Permitidos */}
            {recommended.length > 0 && (
              <div className="space-y-1 pt-2 border-t">
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  <span>Exercícios Permitidos</span>
                </div>
                <ul className="space-y-1 pl-6">
                  {recommended.map((ex, idx) => (
                    <li key={idx} className="text-muted-foreground">✔ {ex}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-1 pt-2 border-t">
                {warnings.map((warning, idx) => (
                  <Alert key={idx} variant="default" className="py-2">
                    <AlertDescription className="text-xs">{warning}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
