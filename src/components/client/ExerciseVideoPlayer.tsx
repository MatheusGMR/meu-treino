import { YouTubePlayer } from "./YouTubePlayer";

interface ExerciseVideoPlayerProps {
  mediaUrl?: string | null;
  mediaType?: string | null;
  exerciseName: string;
  autoplay?: boolean;
  loop?: boolean;
  mute?: boolean;
}

export const ExerciseVideoPlayer = ({
  mediaUrl,
  mediaType,
  exerciseName,
  autoplay = false,
  loop = false,
  mute = false,
}: ExerciseVideoPlayerProps) => {
  if (!mediaUrl) {
    return (
      <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Sem mídia disponível</p>
      </div>
    );
  }

  const isYouTube = mediaUrl.includes("youtube.com") || mediaUrl.includes("youtu.be");

  if ((mediaType === "video" || isYouTube) && isYouTube) {
    return <YouTubePlayer url={mediaUrl} autoplay={autoplay} loop={loop} mute={mute} />;
  }

  if (mediaType === "video") {
    return (
      <div className="aspect-video rounded-lg overflow-hidden bg-black">
        <video
          src={mediaUrl}
          autoPlay={autoplay}
          loop={loop}
          muted={mute}
          controls
          playsInline
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  if (mediaType === "image") {
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
