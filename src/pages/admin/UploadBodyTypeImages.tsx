import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Upload, CheckCircle } from "lucide-react";

const BODY_TYPES = [
  { id: 1, label: "Tipo 1 - Magro" },
  { id: 2, label: "Tipo 2 - Atlético" },
  { id: 3, label: "Tipo 3 - Forte" },
  { id: 4, label: "Tipo 4 - Sobrepeso" },
  { id: 5, label: "Tipo 5 - Obeso" },
];

export default function UploadBodyTypeImages() {
  const [maleFiles, setMaleFiles] = useState<{ [key: number]: File | null }>({});
  const [femaleFiles, setFemaleFiles] = useState<{ [key: number]: File | null }>({});
  const [uploading, setUploading] = useState(false);
  const [uploadedMale, setUploadedMale] = useState<number[]>([]);
  const [uploadedFemale, setUploadedFemale] = useState<number[]>([]);

  const handleFileChange = (type: number, file: File | null, gender: "male" | "female") => {
    if (gender === "male") {
      setMaleFiles((prev) => ({ ...prev, [type]: file }));
    } else {
      setFemaleFiles((prev) => ({ ...prev, [type]: file }));
    }
  };

  const uploadImages = async () => {
    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Upload male images
      for (const [typeId, file] of Object.entries(maleFiles)) {
        if (file) {
          const path = `male/type-${typeId}.png`;
          
          // Delete existing file if it exists
          await supabase.storage.from("body-type-images").remove([path]);
          
          const { error } = await supabase.storage
            .from("body-type-images")
            .upload(path, file, {
              contentType: "image/png",
              upsert: true,
            });

          if (error) {
            console.error(`Error uploading male type ${typeId}:`, error);
            errorCount++;
          } else {
            successCount++;
            setUploadedMale((prev) => [...prev, parseInt(typeId)]);
          }
        }
      }

      // Upload female images
      for (const [typeId, file] of Object.entries(femaleFiles)) {
        if (file) {
          const path = `female/type-${typeId}.png`;
          
          // Delete existing file if it exists
          await supabase.storage.from("body-type-images").remove([path]);
          
          const { error } = await supabase.storage
            .from("body-type-images")
            .upload(path, file, {
              contentType: "image/png",
              upsert: true,
            });

          if (error) {
            console.error(`Error uploading female type ${typeId}:`, error);
            errorCount++;
          } else {
            successCount++;
            setUploadedFemale((prev) => [...prev, parseInt(typeId)]);
          }
        }
      }

      toast({
        title: "Upload concluído",
        description: `${successCount} imagens enviadas com sucesso${errorCount > 0 ? `, ${errorCount} falharam` : ""}`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: "Ocorreu um erro ao fazer upload das imagens",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Upload de Imagens de Tipos Corporais</h1>
        <p className="text-muted-foreground mt-2">
          Faça upload das imagens para os tipos corporais masculinos e femininos
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Male images */}
        <Card>
          <CardHeader>
            <CardTitle>Imagens Masculinas</CardTitle>
            <CardDescription>Selecione as 5 imagens para o gênero masculino</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {BODY_TYPES.map((bodyType) => (
              <div key={`male-${bodyType.id}`} className="space-y-2">
                <Label htmlFor={`male-${bodyType.id}`} className="flex items-center gap-2">
                  {bodyType.label}
                  {uploadedMale.includes(bodyType.id) && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </Label>
                <Input
                  id={`male-${bodyType.id}`}
                  type="file"
                  accept="image/png"
                  onChange={(e) =>
                    handleFileChange(bodyType.id, e.target.files?.[0] || null, "male")
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Female images */}
        <Card>
          <CardHeader>
            <CardTitle>Imagens Femininas</CardTitle>
            <CardDescription>Selecione as 5 imagens para o gênero feminino</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {BODY_TYPES.map((bodyType) => (
              <div key={`female-${bodyType.id}`} className="space-y-2">
                <Label htmlFor={`female-${bodyType.id}`} className="flex items-center gap-2">
                  {bodyType.label}
                  {uploadedFemale.includes(bodyType.id) && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </Label>
                <Input
                  id={`female-${bodyType.id}`}
                  type="file"
                  accept="image/png"
                  onChange={(e) =>
                    handleFileChange(bodyType.id, e.target.files?.[0] || null, "female")
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-center">
        <Button
          onClick={uploadImages}
          disabled={uploading || (Object.keys(maleFiles).length === 0 && Object.keys(femaleFiles).length === 0)}
          size="lg"
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Enviando..." : "Upload das Imagens"}
        </Button>
      </div>
    </div>
  );
}
