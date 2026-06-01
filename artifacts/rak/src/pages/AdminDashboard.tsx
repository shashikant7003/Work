import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Video, Category } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Edit2, Trash2, LogOut, Video as VideoIcon,
  Star, StarOff, X, Loader2, ExternalLink, Search
} from "lucide-react";

type VideoForm = {
  title: string;
  youtube_url: string;
  thumbnail_url: string;
  category: string;
  duration: string;
  featured: boolean;
};

const EMPTY_FORM: VideoForm = {
  title: "",
  youtube_url: "",
  thumbnail_url: "",
  category: "",
  duration: "",
  featured: false,
};

export default function AdminDashboard() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fetchingVideos, setFetchingVideos] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [form, setForm] = useState<VideoForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) {
      setLocation("/admin");
    }
  }, [isAdmin, loading, setLocation]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  async function fetchData() {
    setFetchingVideos(true);
    const [videosRes, categoriesRes] = await Promise.all([
      supabase.from("videos").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
    ]);
    if (videosRes.data) setVideos(videosRes.data as Video[]);
    if (categoriesRes.data) setCategories(categoriesRes.data as Category[]);
    setFetchingVideos(false);
  }

  function openAdd() {
    setEditingVideo(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(video: Video) {
    setEditingVideo(video);
    setForm({
      title: video.title,
      youtube_url: video.youtube_url,
      thumbnail_url: video.thumbnail_url,
      category: video.category,
      duration: video.duration,
      featured: video.featured,
    });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingVideo) {
        const { error } = await supabase.from("videos").update(form).eq("id", editingVideo.id);
        if (error) throw error;
        toast({ title: "Video updated successfully" });
      } else {
        const { error } = await supabase.from("videos").insert([form]);
        if (error) throw error;
        toast({ title: "Video added successfully" });
      }
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      toast({
        title: "Error saving video",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this video? This cannot be undone.")) return;
    setDeletingId(id);
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting video", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Video deleted" });
      setVideos((prev) => prev.filter((v) => v.id !== id));
    }
    setDeletingId(null);
  }

  async function toggleFeatured(video: Video) {
    const { error } = await supabase
      .from("videos")
      .update({ featured: !video.featured })
      .eq("id", video.id);
    if (!error) {
      setVideos((prev) =>
        prev.map((v) => (v.id === video.id ? { ...v, featured: !v.featured } : v))
      );
    }
  }

  async function handleSignOut() {
    await signOut();
    setLocation("/admin");
  }

  const filteredVideos = videos.filter(
    (v) =>
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--gold)" }} />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="glass-card border-b border-border sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #f5c842, #d4a017)" }}>
              <span className="text-sm font-black text-black">R</span>
            </div>
            <div>
              <span className="font-bold text-foreground">RAK Admin</span>
              <span className="text-xs text-muted-foreground ml-2">{user?.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-view-portfolio">
              <ExternalLink className="w-4 h-4" /> View Portfolio
            </a>
            <button
              onClick={handleSignOut}
              data-testid="button-sign-out"
              className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground glass-card"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Videos", value: videos.length },
            { label: "Featured", value: videos.filter((v) => v.featured).length },
            { label: "Categories", value: categories.length },
            { label: "Latest", value: videos[0]?.category || "—" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-5 gradient-border">
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Videos table */}
        <div className="glass-card rounded-2xl overflow-hidden gradient-border">
          <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border">
            <div className="flex items-center gap-3">
              <VideoIcon className="w-5 h-5" style={{ color: "var(--gold)" }} />
              <h2 className="font-semibold text-foreground">Videos</h2>
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {filteredVideos.length}
              </span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search videos..."
                  data-testid="input-search"
                  className="w-full pl-9 pr-4 py-2 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
              <button
                onClick={openAdd}
                data-testid="button-add-video"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all"
                style={{ background: "linear-gradient(135deg, #f5c842, #d4a017)", color: "#0a0a0a" }}
              >
                <Plus className="w-4 h-4" /> Add Video
              </button>
            </div>
          </div>

          {fetchingVideos ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--gold)" }} />
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <VideoIcon className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">{searchTerm ? "No videos match your search" : "No videos yet"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Video</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Duration</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Featured</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVideos.map((video) => (
                    <tr key={video.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors" data-testid={`row-video-${video.id}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                            {video.thumbnail_url ? (
                              <img src={video.thumbnail_url} alt={video.title}
                                className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <VideoIcon className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-foreground line-clamp-1">{video.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="px-2 py-1 rounded-full text-xs text-muted-foreground"
                          style={{ background: "var(--gold-dim)" }}>
                          {video.category || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground hidden lg:table-cell">{video.duration || "—"}</td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => toggleFeatured(video)}
                          data-testid={`button-featured-${video.id}`}
                          className="transition-all hover:scale-110"
                        >
                          {video.featured ? (
                            <Star className="w-4 h-4 fill-current" style={{ color: "var(--gold)" }} />
                          ) : (
                            <StarOff className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(video)}
                            data-testid={`button-edit-${video.id}`}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground glass-card transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(video.id)}
                            disabled={deletingId === video.id}
                            data-testid={`button-delete-${video.id}`}
                            className="p-2 rounded-lg text-muted-foreground hover:text-red-400 glass-card transition-all disabled:opacity-50"
                          >
                            {deletingId === video.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Video Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="glass-card rounded-2xl w-full max-w-lg gradient-border overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h3 className="font-semibold text-foreground">
                {editingVideo ? "Edit Video" : "Add Video"}
              </h3>
              <button onClick={() => setShowModal(false)} data-testid="button-close-modal"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground glass-card transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4" data-testid="form-video">
              {[
                { label: "Title", key: "title", type: "text", required: true, placeholder: "Wedding Highlights — John & Jane" },
                { label: "YouTube URL", key: "youtube_url", type: "url", required: true, placeholder: "https://youtube.com/watch?v=..." },
                { label: "Thumbnail URL", key: "thumbnail_url", type: "url", required: false, placeholder: "https://..." },
                { label: "Duration", key: "duration", type: "text", required: false, placeholder: "3:45" },
              ].map(({ label, key, type, required, placeholder }) => (
                <div key={key}>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof VideoForm] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    required={required}
                    placeholder={placeholder}
                    data-testid={`input-${key}`}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                </div>
              ))}

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  data-testid="select-category"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-foreground outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    data-testid="checkbox-featured"
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-all ${form.featured ? "" : "bg-muted"}`}
                    style={form.featured ? { background: "linear-gradient(135deg, #f5c842, #d4a017)" } : {}}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.featured ? "left-5" : "left-1"}`} />
                  </div>
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  Mark as Featured
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  data-testid="button-cancel"
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium glass-card text-muted-foreground hover:text-foreground transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  data-testid="button-save"
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #f5c842, #d4a017)", color: "#0a0a0a" }}>
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : (editingVideo ? "Save Changes" : "Add Video")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
