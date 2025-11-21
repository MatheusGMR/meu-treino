import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useExerciseBulkImport } from "@/hooks/useExerciseBulkImport";
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ExerciseImport() {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const bulkImport = useExerciseBulkImport();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Por favor, selecione um arquivo CSV');
      return;
    }

    setFile(selectedFile);

    // Preview first 10 rows
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').slice(0, 11); // Header + 10 rows
      const preview = lines.map(line => 
        line.split(';').map(cell => cell.trim()).slice(0, 5) // First 5 columns
      );
      setPreviewData(preview);
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = () => {
    if (!file) {
      alert('Selecione um arquivo CSV primeiro');
      return;
    }

    bulkImport.mutate(file);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Importação em Massa de Exercícios</h1>
        <p className="text-muted-foreground">
          Importe exercícios em massa a partir de um arquivo CSV
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Selecionar Arquivo CSV
          </CardTitle>
          <CardDescription>
            Faça upload do arquivo CSV com os exercícios. Formato esperado: exercise_id;name;exercise_type;exercise_group;...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={bulkImport.isPending}
              className="max-w-md"
            />
            <Button
              onClick={handleImport}
              disabled={!file || bulkImport.isPending}
              className="min-w-[140px]"
            >
              {bulkImport.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          </div>

          {file && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Arquivo selecionado: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview dos Dados (primeiras 10 linhas, 5 colunas)</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {previewData[0]?.map((header, i) => (
                      <th key={i} className="text-left p-2 font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(1).map((row, i) => (
                    <tr key={i} className="border-b">
                      {row.map((cell, j) => (
                        <td key={j} className="p-2 max-w-[200px] truncate">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {bulkImport.isSuccess && bulkImport.data?.success && bulkImport.data.stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Importação Concluída
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{bulkImport.data.stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Processados</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{bulkImport.data.stats.inserted}</div>
                <div className="text-sm text-muted-foreground">Inseridos</div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{bulkImport.data.stats.updated}</div>
                <div className="text-sm text-muted-foreground">Atualizados</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{bulkImport.data.stats.errors}</div>
                <div className="text-sm text-muted-foreground">Erros</div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              ⏱️ Tempo de processamento: {(bulkImport.data.stats.processingTime / 1000).toFixed(2)}s
            </div>

            {bulkImport.data.stats.errorDetails.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  Detalhes dos Erros ({bulkImport.data.stats.errorDetails.length})
                </h3>
                <ScrollArea className="h-[200px] w-full border rounded-md p-4">
                  {bulkImport.data.stats.errorDetails.map((error, i) => (
                    <div key={i} className="mb-2 pb-2 border-b last:border-0">
                      <div className="text-sm font-semibold">Linha {error.line}:</div>
                      <div className="text-sm text-red-600">{error.error}</div>
                      {error.data && (
                        <div className="text-xs text-muted-foreground mt-1 font-mono">
                          {JSON.stringify(error.data).substring(0, 200)}...
                        </div>
                      )}
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {bulkImport.isError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao importar: {bulkImport.error?.message || "Erro desconhecido"}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
