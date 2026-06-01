import { Play, Star } from "lucide-react";
import type { Video } from "@/lib/supabase";

type Props = {
  videos: Video[];
  onPlay: (video: Video) => void;
  loading: boolean;
};

export default function FeaturedVideos({ videos, onPlay, loading }: Props) {
  if (!loading && videos.length === 0) return null;

  return (
    <section id="featured" className="py-24 px-6" data-testid="featured-section">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-12">
          <div className="p-2 rounded-xl" style={{ background: "var(--gold-dim)" }}>
            <Star className="w-5 h-5 fill-current" style={{ color: "var(--gold)" }} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-foreground tracking-tight">Featured Work</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Handpicked best projects</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, i) => (
              <VideoCard key={video.id} video={video} onPlay={onPlay} priority={i === 0} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function VideoCard({ video, onPlay, priority }: { video: Video; onPlay: (v: Video) => void; priority?: boolean }) {
  const youtubeId = extractYouTubeId(video.youtube_url);
  const thumb = video.thumbnail_url || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : "");

  return (
    <button
      onClick={() => onPlay(video)}
      data-testid={`card-featured-${video.id}`}
      className={`video-card glass-card rounded-2xl overflow-hidden text-left group w-full ${priority ? "md:col-span-2 lg:col-span-1" : ""}`}
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        {thumb ? (
          <img src={thumb} alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-14 h-14 rounded-full flex items-center justify-center gold-glow"
            style={{ background: "linear-gradient(135deg, #f5c842, #d4a017)" }}>
            <Play className="w-5 h-5 fill-current text-black ml-0.5" />
          </div>
        </div>
        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md text-xs font-medium"
            style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}>
            {video.duration}
          </div>
        )}
        {/* Featured badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
          style={{ background: "var(--gold-dim)", border: "1px solid rgba(245,200,66,0.3)", color: "var(--gold)" }}>
          <Star className="w-3 h-3 fill-current" />
          Featured
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground group-hover:text-yellow-400 transition-colors line-clamp-1">
          {video.title}
        </h3>
        {video.category && (
          <span className="text-xs text-muted-foreground mt-1 block">{video.category}</span>
        )}
      </div>
    </button>
  );
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}
