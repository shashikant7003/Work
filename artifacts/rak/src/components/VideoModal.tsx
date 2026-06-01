import { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import type { Video } from "@/lib/supabase";

type Props = {
  video: Video;
  onClose: () => void;
};

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

export default function VideoModal({ video, onClose }: Props) {
  const youtubeId = extractYouTubeId(video.youtube_url);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-testid="video-modal"
    >
      <div className="w-full max-w-5xl glass-card rounded-2xl overflow-hidden gradient-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-foreground text-lg line-clamp-1">{video.title}</h2>
            <div className="flex items-center gap-3 mt-0.5">
              {video.category && (
                <span className="text-xs text-muted-foreground">{video.category}</span>
              )}
              {video.duration && (
                <span className="text-xs text-muted-foreground">· {video.duration}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={video.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-youtube"
              className="p-2 rounded-lg glass-card text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              data-testid="button-close-modal"
              className="p-2 rounded-lg glass-card text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video */}
        <div className="aspect-video bg-black">
          {youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
              <p className="text-sm">Could not embed this video.</p>
              <a
                href={video.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: "linear-gradient(135deg, #f5c842, #d4a017)", color: "#0a0a0a" }}
              >
                <ExternalLink className="w-4 h-4" /> Watch on YouTube
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
