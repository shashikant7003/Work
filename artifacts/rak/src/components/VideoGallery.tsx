import { useState } from "react";
import { Play, Search, Grid3X3, List, Clock, Lock, X, Loader2, Eye, EyeOff } from "lucide-react";
import type { Video, Category } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

type Props = {
  videos: Video[];
  categories: Category[];
  onPlay: (video: Video) => void;
  loading: boolean;
};

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

// ─── Password modal — uses server-side RPC so project_password never leaves DB ─
function PasswordModal({
  video,
  onClose,
  onUnlock,
}: {
  video: Video;
  onClose: () => void;
  onUnlock: () => void;
}) {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  // Rate-limit: block after 5 wrong attempts
  const blocked = attempts >= 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || blocked) return;
    setChecking(true);
    setError("");
    try {
      // Server-side check — project_password is never sent to the client or compared in JS
      const { data, error: rpcError } = await supabase.rpc("check_video_password", {
        video_id: video.id,
        attempt: password.trim(),
      });
      if (rpcError) {
        // RPC function doesn't exist yet (migration not run) — fallback message
        setError("Password verification is temporarily unavailable. Please run the database migration.");
        return;
      }
      if (data === true) {
        onUnlock();
      } else {
        setAttempts((n) => n + 1);
        setError(
          attempts + 1 >= 5
            ? "Too many incorrect attempts."
            : "Incorrect password. Please try again."
        );
        setPassword("");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-testid="password-modal"
    >
      <div className="glass-card rounded-2xl w-full max-w-sm gradient-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--gold-dim)", border: "1px solid rgba(245,200,66,0.25)" }}>
              <Lock className="w-4 h-4" style={{ color: "var(--gold)" }} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Protected Project</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Enter password to watch</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground glass-card transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-muted-foreground mb-4 line-clamp-1">
            <span className="text-foreground font-medium">{video.title}</span>
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value.slice(0, 100)); setError(""); }}
                  placeholder="Enter project password"
                  autoFocus
                  disabled={blocked}
                  maxLength={100}
                  data-testid="input-project-password"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 outline-none disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"}` }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  disabled={blocked}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium glass-card text-muted-foreground hover:text-foreground transition-all">
                Cancel
              </button>
              <button
                type="submit"
                disabled={checking || !password.trim() || blocked}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #f5c842, #d4a017)", color: "#0a0a0a" }}
              >
                {checking ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking...</> : "Unlock"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Main gallery ─────────────────────────────────────────────────────────────
export default function VideoGallery({ videos, categories, onPlay, loading }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [lockedVideo, setLockedVideo] = useState<Video | null>(null);

  function handleCardClick(video: Video) {
    if (video.is_locked) {
      setLockedVideo(video);
    } else {
      onPlay(video);
    }
  }

  const filtered = videos.filter((v) => {
    const matchesSearch = v.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || v.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const allCategories = ["All", ...categories.map((c) => c.name)];

  return (
    <section id="gallery" className="py-24 px-6" data-testid="gallery-section">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-2">All Work</h2>
          <p className="text-muted-foreground text-sm">{videos.length} projects</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-10">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value.slice(0, 100))}
              placeholder="Search projects..."
              data-testid="input-gallery-search"
              maxLength={100}
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap flex-1">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                data-testid={`filter-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                className="px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200"
                style={
                  activeCategory === cat
                    ? { background: "linear-gradient(135deg, #f5c842, #d4a017)", color: "#0a0a0a" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }
                }
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 glass-card rounded-xl p-1 self-start">
            <button
              onClick={() => setView("grid")}
              data-testid="button-grid-view"
              className="p-2 rounded-lg transition-all"
              style={view === "grid" ? { background: "var(--gold-dim)", color: "var(--gold)" } : { color: "rgba(255,255,255,0.4)" }}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              data-testid="button-list-view"
              className="p-2 rounded-lg transition-all"
              style={view === "list" ? { background: "var(--gold-dim)", color: "var(--gold)" } : { color: "rgba(255,255,255,0.4)" }}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No videos found</p>
            <p className="text-sm mt-1 opacity-60">Try a different search or category</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((video) => (
              <GridCard key={video.id} video={video} onPlay={handleCardClick} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((video) => (
              <ListCard key={video.id} video={video} onPlay={handleCardClick} />
            ))}
          </div>
        )}
      </div>

      {lockedVideo && (
        <PasswordModal
          video={lockedVideo}
          onClose={() => setLockedVideo(null)}
          onUnlock={() => {
            onPlay(lockedVideo);
            setLockedVideo(null);
          }}
        />
      )}
    </section>
  );
}

// ─── Card components ──────────────────────────────────────────────────────────
function GridCard({ video, onPlay }: { video: Video; onPlay: (v: Video) => void }) {
  const youtubeId = extractYouTubeId(video.youtube_url);
  const thumb = video.thumbnail_url || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : "");

  return (
    <button
      onClick={() => onPlay(video)}
      data-testid={`card-video-${video.id}`}
      className="video-card glass-card rounded-2xl overflow-hidden text-left group w-full"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        {thumb ? (
          <img src={thumb} alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />

        {video.is_locked ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center glass-card"
              style={{ border: "1px solid rgba(245,200,66,0.3)", backdropFilter: "blur(4px)" }}>
              <Lock className="w-5 h-5" style={{ color: "var(--gold)" }} />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #f5c842, #d4a017)" }}>
              <Play className="w-4 h-4 fill-current text-black ml-0.5" />
            </div>
          </div>
        )}

        {video.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs font-medium"
            style={{ background: "rgba(0,0,0,0.8)" }}>
            {video.duration}
          </div>
        )}

        {video.is_locked && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
            style={{ background: "rgba(0,0,0,0.7)", color: "var(--gold)" }}>
            <Lock className="w-2.5 h-2.5" /> Private
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm text-foreground group-hover:text-yellow-400 transition-colors line-clamp-1">
          {video.title}
        </h3>
        {video.category && (
          <span className="text-xs text-muted-foreground mt-0.5 block">{video.category}</span>
        )}
      </div>
    </button>
  );
}

function ListCard({ video, onPlay }: { video: Video; onPlay: (v: Video) => void }) {
  const youtubeId = extractYouTubeId(video.youtube_url);
  const thumb = video.thumbnail_url || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : "");

  return (
    <button
      onClick={() => onPlay(video)}
      data-testid={`list-video-${video.id}`}
      className="video-card glass-card rounded-xl overflow-hidden text-left group w-full flex items-center gap-4 p-3"
    >
      <div className="relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
        {thumb ? (
          <img src={thumb} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
          {video.is_locked
            ? <Lock className="w-4 h-4" style={{ color: "var(--gold)" }} />
            : <Play className="w-4 h-4 fill-current" style={{ color: "var(--gold)" }} />
          }
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm text-foreground group-hover:text-yellow-400 transition-colors line-clamp-1">
            {video.title}
          </h3>
          {video.is_locked && (
            <Lock className="w-3 h-3 flex-shrink-0" style={{ color: "var(--gold)" }} />
          )}
        </div>
        {video.category && (
          <span className="text-xs text-muted-foreground mt-0.5 block">{video.category}</span>
        )}
      </div>
      {video.duration && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
          <Clock className="w-3 h-3" />
          {video.duration}
        </div>
      )}
    </button>
  );
}
