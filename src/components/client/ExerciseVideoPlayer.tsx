import { YouTubePlayer } from "./YouTubePlayer";

interface ExerciseVideoPlayerProps {
  mediaUrl?: string | null;
  /** Dica opcional. Se omitido, é detectado pela extensão/URL. */
  mediaType?: string | null;
  exerciseName: string;
  autoplay?: boolean;
  loop?: boolean;
  mute?: boolean;
  onEnded?: () => void;
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i;
const VIDEO_EXT = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i;

function detectKind(url: string): "youtube" | "image" | "video" | "unknown" {
  if (!url) return "unknown";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (IMAGE_EXT.test(url)) return "image";
  if (VIDEO_EXT.test(url)) return "video";
  return "unknown";
}

export const ExerciseVideoPlayer = ({
  mediaUrl,
  mediaType,
  exerciseName,
  autoplay = false,
  loop = false,
  mute = false,
  onEnded,
}: ExerciseVideoPlayerProps) => {
  if (!mediaUrl) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Sem mídia disponível</p>
      </div>
    );
  }

  const detected = detectKind(mediaUrl);
  // mediaType (hint) só é respeitado quando a URL não denuncia outro formato.
  const kind =
    detected !== "unknown"
      ? detected
      : mediaType === "image"
      ? "image"
      : mediaType === "video"
      ? "video"
      : "unknown";

  if (kind === "youtube") {
    return (
      <YouTubePlayer
        url={mediaUrl}
        autoplay={autoplay}
        loop={loop}
        mute={mute}
        onEnded={onEnded}
      />
    );
  }

  if (kind === "video") {
    return (
      <div className="w-full h-full overflow-hidden bg-black">
        <video
          src={mediaUrl}
          autoPlay={autoplay}
          loop={loop}
          muted={mute}
          controls
          playsInline
          onEnded={loop ? undefined : onEnded}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  if (kind === "image") {
    return (
      <div className="w-full h-full overflow-hidden bg-black">
        <img
          src={mediaUrl}
          alt={exerciseName}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // Fallback: tenta como iframe genérico (Vimeo etc.)
  return (
    <iframe
      src={mediaUrl}
      title={exerciseName}
      className="w-full h-full"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
    />
  );
};
