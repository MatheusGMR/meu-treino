import { useState } from "react";
import { AppLayout } from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface MigrationStats {
  total_exercises: number;
  matched: number;
  inserted: number;
  skipped: number;
  restrictions_added: number;
  errors_count: number;
  errors_sample: string[];
}

export default function LibraryMigration() {
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setStats(null);
    try {
      const { data, error } = await supabase.functions.invoke("migrate-exercise-library", {
        body: {},
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setStats(data.stats);
      toast({
        title: "Migração concluída",
        description: `${data.stats.matched} atualizados, ${data.stats.inserted} novos.`,
      });
    } catch (e: any) {
      const msg = e?.message || "Falha desconhecida";
      setError(msg);
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Biblioteca de Exercícios v2.0
            </span>
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Importa o documento oficial Meu Treino v2.0 (158 exercícios + 21 restrições por
            limitação) usando a estratégia "atualizar por nome".
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              O que esta migração faz
            </CardTitle>
            <CardDescription>
              Para cada exercício do documento, tentamos casar pelo <strong>nome</strong> com a
              biblioteca atual:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  <strong>Match</strong>: preenche os novos campos (ID externo, segurança, bloco,
                  equipamento, movimento, variação) sem alterar vídeo, descrição etc.
                </li>
                <li>
                  <strong>Sem match</strong>: insere como exercício novo da biblioteca v2.0.
                </li>
                <li>Importa 21 restrições por limitação (Ombro, Lombar, Joelho).</li>
              </ul>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRun} disabled={running} variant="hero">
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Importar Biblioteca v2.0
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>Erro na migração</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Relatório
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Total no doc" value={stats.total_exercises} />
                <Stat label="Atualizados" value={stats.matched} highlight />
                <Stat label="Inseridos" value={stats.inserted} highlight />
                <Stat label="Restrições" value={stats.restrictions_added} />
              </div>
              {(stats.skipped > 0 || stats.errors_count > 0) && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertTitle>
                    {stats.errors_count} erro{stats.errors_count !== 1 ? "s" : ""} /{" "}
                    {stats.skipped} pulado{stats.skipped !== 1 ? "s" : ""}
                  </AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-2 text-sm">
                      {stats.errors_sample.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

const Stat = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) => (
  <div className="rounded-lg border bg-card/100 p-4 text-center">
    <p
      className={`text-3xl font-bold ${
        highlight ? "bg-gradient-primary bg-clip-text text-transparent" : "text-foreground"
      }`}
    >
      {value}
    </p>
    <p className="text-xs text-muted-foreground mt-1">{label}</p>
  </div>
);
