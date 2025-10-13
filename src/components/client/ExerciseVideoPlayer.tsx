import { YouTubePlayer } from "./YouTubePlayer";

interface ExerciseVideoPlayerProps {
  mediaUrl?: string | null;
  mediaType?: string | null;
  exerciseName: string;
}

export const ExerciseVideoPlayer = ({ 
  mediaUrl, 
  mediaType, 
  exerciseName 
}: ExerciseVideoPlayerProps) => {
  if (!mediaUrl) {
    return (
      <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Sem mídia disponível</p>
      </div>
    );
  }

  if (mediaType === 'video' && mediaUrl.includes('youtube.com')) {
    return <YouTubePlayer url={mediaUrl} />;
  }

  if (mediaType === 'image') {
    return (
      <div className="aspect-video rounded-lg overflow-hidden">
        <img 
          src={mediaUrl} 
          alt={exerciseName}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
      <p className="text-muted-foreground">Formato de mídia não suportado</p>
    </div>
  );
};
