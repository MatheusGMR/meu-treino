import { useMemo } from "react";

interface YouTubePlayerProps {
  url: string;
  autoplay?: boolean;
  loop?: boolean;
  mute?: boolean;
  controls?: boolean;
}

export const YouTubePlayer = ({
  url,
  autoplay = false,
  loop = false,
  mute = false,
  controls = true,
}: YouTubePlayerProps) => {
  const videoId = useMemo(() => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }, [url]);

  if (!videoId) {
    return (
      <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">URL de vídeo inválida</p>
      </div>
    );
  }

  const params = new URLSearchParams();
  if (autoplay) params.set("autoplay", "1");
  if (mute) params.set("mute", "1");
  if (loop) {
    params.set("loop", "1");
    params.set("playlist", videoId);
  }
  params.set("controls", controls ? "1" : "0");
  params.set("rel", "0");
  params.set("modestbranding", "1");
  params.set("playsinline", "1");

  return (
    <div className="aspect-video rounded-lg overflow-hidden bg-black">
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}?${params.toString()}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};
