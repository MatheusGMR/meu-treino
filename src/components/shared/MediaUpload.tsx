import { useState } from "react";
import { Upload, X, Image, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface MediaUploadProps {
  value?: string;
  mediaType?: "image" | "video";
  onMediaTypeChange: (type: "image" | "video") => void;
  onFileSelect: (file: File | undefined) => void;
  onUrlChange: (url: string) => void;
}

export const MediaUpload = ({
  value,
  mediaType = "image",
  onMediaTypeChange,
  onFileSelect,
  onUrlChange,
}: MediaUploadProps) => {
  const [preview, setPreview] = useState<string | undefined>(value);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (mediaType === "image" && !isImage) {
      alert("Por favor, selecione uma imagem válida");
      return;
    }

    if (mediaType === "video" && !isVideo) {
      alert("Por favor, selecione um vídeo válido");
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      alert("Arquivo muito grande. Máximo: 20MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onFileSelect(file);
  };

  const handleRemove = () => {
    setPreview(undefined);
    onFileSelect(undefined);
    onUrlChange("");
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Tipo de Demonstração</Label>
        <RadioGroup
          value={mediaType}
          onValueChange={(val) => onMediaTypeChange(val as "image" | "video")}
          className="flex gap-4 mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="image" id="image" />
            <Label htmlFor="image" className="flex items-center gap-2 cursor-pointer">
              <Image className="w-4 h-4" />
              Imagem
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="video" id="video" />
            <Label htmlFor="video" className="flex items-center gap-2 cursor-pointer">
              <Video className="w-4 h-4" />
              Vídeo
            </Label>
          </div>
        </RadioGroup>
      </div>

      {preview ? (
        <div className="relative">
          {mediaType === "image" ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border"
            />
          ) : (
            <video
              src={preview}
              controls
              className="w-full h-48 rounded-lg border"
            />
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <Label
            htmlFor="media-upload"
            className="cursor-pointer text-primary hover:underline"
          >
            Clique para fazer upload
          </Label>
          <input
            id="media-upload"
            type="file"
            accept={mediaType === "image" ? "image/*" : "video/*"}
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="text-sm text-muted-foreground mt-2">
            {mediaType === "image" ? "PNG, JPG até 20MB" : "MP4, MOV até 20MB"}
          </p>
        </div>
      )}
    </div>
  );
};
