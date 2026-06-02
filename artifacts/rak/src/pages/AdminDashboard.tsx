import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Video, Category } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Edit2, Trash2, LogOut, Video as VideoIcon,
  Star, StarOff, X, Loader2, ExternalLink, Search,
  Lock, LockOpen, FolderOpen, Eye, EyeOff, Tag, AlertTriangle, Copy, Check
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Input validation ─────────────────────────────────────────────────────────

const YT_PATTERN = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]{11}/;
const HTTPS_PATTERN = /^https?:\/\/.+/;
const DURATION_PATTERN = /^\d{1,2}:\d{2}$/;

type ValidationResult = { ok: true } | { ok: false; field: string; message: string };

function validateVideoForm(form: VideoForm): ValidationResult {
  const title = form.title.trim();
  if (!title) return { ok: false, field: "title", message: "Title is required." };
  if (title.length > 200) return { ok: false, field: "title", message: "Title must be 200 characters or fewer." };

  if (!YT_PATTERN.test(form.youtube_url.trim())) {
    return { ok: false, field: "youtube_url", message: "Enter a valid YouTube URL (youtube.com or youtu.be)." };
  }

  if (form.thumbnail_url.trim() && !HTTPS_PATTERN.test(form.thumbnail_url.trim())) {
    return { ok: false, field: "thumbnail_url", message: "Thumbnail URL must start with https://." };
  }

  if (form.duration.trim() && !DURATION_PATTERN.test(form.duration.trim())) {
    return { ok: false, field: "duration", message: "Duration must be in M:SS or MM:SS format (e.g. 3:45)." };
  }

  if (form.is_locked && !form.project_password.trim()) {
    return { ok: false, field: "project_password", message: "Password is required when lock is enabled." };
  }

  if (form.project_password.length > 100) {
    return { ok: false, field: "project_password", message: "Password must be 100 characters or fewer." };
  }

  return { ok: true };
}

// ─── Error extraction ─────────────────────────────────────────────────────────

/** Extract a human-readable message from any thrown value, including PostgrestError */
function extractError(err: unknown): string {
  if (!err) return "Unknown error";
  if (typeof err === "object") {
    const e = err as Record<string, unknown>;
    // PostgrestError shape: { message, details, hint, code }
    const parts: string[] = [];
    if (e.message) parts.push(String(e.message));
    if (e.details) parts.push(`Details: ${e.details}`);
    if (e.hint) parts.push(`Hint: ${e.hint}`);
    if (e.code) parts.push(`Code: ${e.code}`);
    if (parts.length) return parts.join(" — ");
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type VideoForm = {
  title: string;
  youtube_url: string;
  thumbnail_url: string;
  category: string;
  duration: string;
  featured: boolean;
  is_locked: boolean;
  project_password: string;
};

const EMPTY_FORM: VideoForm = {
  title: "",
  youtube_url: "",
  thumbnail_url: "",
  category: "",
  duration: "",
  featured: false,
  is_locked: false,
  project_password: "",
};

type CategoryForm = { name: string; slug: string };
const EMPTY_CAT: CategoryForm = { name: "", slug: "" };
type Tab = "videos" | "categories";

/** Detected schema state — which optional columns exist in the DB */
type SchemaState = {
  checked: boolean;
  videosHasLock: boolean;  // is_locked + project_password columns
  catsHasSlug: boolean;    // slug column
};

// ─── Migration banner ─────────────────────────────────────────────────────────

const MIGRATION_SQL = `ALTER TABLE videos
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS project_password text NOT NULL DEFAULT '';

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS slug text NOT NULL DEFAULT '';

UPDATE categories
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\\s-]', '', 'g'), '\\s+', '-', 'g'))
WHERE slug = '';`;

function MigrationBanner({ missingVideoCols, missingCatCols }: { missingVideoCols: boolean; missingCatCols: boolean }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(MIGRATION_SQL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  const missing = [];
  if (missingVideoCols) missing.push("videos.is_locked, videos.project_password");
  if (missingCatCols) missing.push("categories.slug");

  return (
    <div className="rounded-xl mb-6 overflow-hidden"
      style={{ border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.06)" }}>
      <div className="px-5 py-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-400">Database migration required</p>
          <p className="text-xs text-amber-400/70 mt-1">
            Missing columns: <span className="font-mono">{missing.join(", ")}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Copy the SQL below and run it in your{" "}
            <a href="https://supabase.com/dashboard/project/xokmlkgpqaliyksxpaaw/sql/new"
              target="_blank" rel="noopener noreferrer"
              className="underline text-amber-400/80 hover:text-amber-400">
              Supabase SQL Editor
            </a>.
          </p>
          <div className="mt-3 relative">
            <pre className="text-xs font-mono p-3 rounded-lg overflow-x-auto"
              style={{ background: "rgba(0,0,0,0.4)", color: "rgba(255,255,255,0.7)", whiteSpace: "pre-wrap" }}>
              {MIGRATION_SQL}
            </pre>
            <button onClick={copy}
              className="absolute top-2 right-2 p-1.5 rounded-md transition-all"
              style={{ background: "rgba(255,255,255,0.08)" }}>
              {copied
                ? <Check className="w-3.5 h-3.5 text-green-400" />
                : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user, isAdmin, loading, setIsAdmin, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("videos");
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fetchingVideos, setFetchingVideos] = useState(true);
  const [schema, setSchema] = useState<SchemaState>({ checked: false, videosHasLock: false, catsHasSlug: false });

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [form, setForm] = useState<VideoForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState<CategoryForm>(EMPTY_CAT);
  const [savingCat, setSavingCat] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !isAdmin) {
      // Re-check admin status from Supabase in case page was refreshed
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!session?.user?.email) { setLocation("/admin"); return; }
        const { data } = await supabase.from("admins").select("id").eq("email", session.user.email).maybeSingle();
        if (data) { setIsAdmin(true); }
        else setLocation("/admin");
      });
    }
  }, [isAdmin, loading, setLocation, setIsAdmin]);

  useEffect(() => {
    if (isAdmin) {
      detectSchema();
      fetchData();
    }
  }, [isAdmin]);

  // ── Schema detection ────────────────────────────────────────────────────────
  async function detectSchema() {
    // Probe for is_locked by selecting it specifically — PGRST204 = column missing
    const [videoProbe, catProbe] = await Promise.all([
      supabase.from("videos").select("is_locked, project_password").limit(0),
      supabase.from("categories").select("slug").limit(0),
    ]);
    setSchema({
      checked: true,
      videosHasLock: !videoProbe.error,
      catsHasSlug: !catProbe.error,
    });
  }

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

  // ── Video CRUD ──────────────────────────────────────────────────────────────
  function openAddVideo() {
    setEditingVideo(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setShowVideoModal(true);
  }

  function openEditVideo(video: Video) {
    setEditingVideo(video);
    setForm({
      title: video.title,
      youtube_url: video.youtube_url,
      thumbnail_url: video.thumbnail_url || "",
      category: video.category || "",
      duration: video.duration || "",
      featured: video.featured,
      is_locked: video.is_locked ?? false,
      project_password: video.project_password ?? "",
    });
    setShowPassword(false);
    setShowVideoModal(true);
  }

  async function handleSaveVideo(e: React.FormEvent) {
    e.preventDefault();

    if (schema.videosHasLock && form.is_locked && !form.project_password.trim()) {
      toast({ title: "Password required", description: "Set a password before locking this project.", variant: "destructive" });
      return;
    }

    // Validate all inputs before touching the DB
    const validation = validateVideoForm(form);
    if (!validation.ok) {
      toast({ title: "Validation error", description: validation.message, variant: "destructive" });
      return;
    }

    setSaving(true);

    // Build payload — only include lock fields if the DB columns exist
    const basePayload = {
      title: form.title.trim(),
      youtube_url: form.youtube_url.trim(),
      thumbnail_url: form.thumbnail_url.trim(),
      category: form.category,
      duration: form.duration.trim(),
      featured: form.featured,
    };

    const payload = schema.videosHasLock
      ? { ...basePayload, is_locked: form.is_locked, project_password: form.is_locked ? form.project_password.trim() : "" }
      : basePayload;

    try {
      if (editingVideo) {
        const { error } = await supabase.from("videos").update(payload).eq("id", editingVideo.id);
        if (error) throw error;
        toast({ title: "Video updated successfully" });
      } else {
        const { error } = await supabase.from("videos").insert([payload]);
        if (error) throw error;
        toast({ title: "Video added successfully" });
      }
      setShowVideoModal(false);
      fetchData();
    } catch (err: unknown) {
      toast({ title: "Error saving video", description: extractError(err), variant: "destructive" });
      console.error("Video save error:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteVideo(id: string) {
    if (!confirm("Delete this video? This cannot be undone.")) return;
    setDeletingId(id);
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting video", description: extractError(error), variant: "destructive" });
    } else {
      toast({ title: "Video deleted" });
      setVideos((prev) => prev.filter((v) => v.id !== id));
    }
    setDeletingId(null);
  }

  async function toggleFeatured(video: Video) {
    const { error } = await supabase.from("videos").update({ featured: !video.featured }).eq("id", video.id);
    if (error) {
      toast({ title: "Error updating video", description: extractError(error), variant: "destructive" });
    } else {
      setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, featured: !v.featured } : v)));
    }
  }

  async function toggleLocked(video: Video) {
    if (!schema.videosHasLock) {
      toast({ title: "Migration required", description: "Run the database migration first to enable password protection.", variant: "destructive" });
      return;
    }
    if (!video.is_locked && !video.project_password) {
      openEditVideo(video);
      toast({ title: "Set a password first", description: "Open the edit form to add a password before locking." });
      return;
    }
    const { error } = await supabase.from("videos").update({ is_locked: !video.is_locked }).eq("id", video.id);
    if (error) {
      toast({ title: "Error updating lock", description: extractError(error), variant: "destructive" });
    } else {
      setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, is_locked: !v.is_locked } : v)));
    }
  }

  // ── Category CRUD ───────────────────────────────────────────────────────────
  function openAddCategory() {
    setEditingCat(null);
    setCatForm(EMPTY_CAT);
    setShowCatModal(true);
  }

  function openEditCategory(cat: Category) {
    setEditingCat(cat);
    setCatForm({ name: cat.name, slug: cat.slug || "" });
    setShowCatModal(true);
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!catForm.name.trim()) return;
    setSavingCat(true);

    const autoSlug = catForm.name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const slug = (catForm.slug.trim() || autoSlug);

    // Only include slug if the DB column exists
    const payload = schema.catsHasSlug
      ? { name: catForm.name.trim(), slug }
      : { name: catForm.name.trim() };

    try {
      if (editingCat) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editingCat.id);
        if (error) throw error;
        toast({ title: "Category updated" });
        setCategories((prev) => prev.map((c) => (c.id === editingCat.id ? { ...c, ...payload } : c)));
      } else {
        const { data, error } = await supabase.from("categories").insert([payload]).select().single();
        if (error) throw error;
        toast({ title: "Category added" });
        if (data) setCategories((prev) => [...prev, data as Category].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setShowCatModal(false);
    } catch (err: unknown) {
      toast({ title: "Error saving category", description: extractError(err), variant: "destructive" });
      console.error("Category save error:", err);
    } finally {
      setSavingCat(false);
    }
  }

  async function handleDeleteCategory(id: string, name: string) {
    const usedBy = videos.filter((v) => v.category === name).length;
    const msg = usedBy > 0
      ? `"${name}" is used by ${usedBy} video${usedBy > 1 ? "s" : ""}. Delete anyway?`
      : `Delete category "${name}"?`;
    if (!confirm(msg)) return;
    setDeletingCatId(id);
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting category", description: extractError(error), variant: "destructive" });
    } else {
      toast({ title: "Category deleted" });
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
    setDeletingCatId(null);
  }

  async function handleSignOut() {
    await signOut();
    setLocation("/admin");
  }

  const filteredVideos = videos.filter(
    (v) =>
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--gold)" }} />
      </div>
    );
  }

  if (!isAdmin) return null;

  const needsMigration = schema.checked && (!schema.videosHasLock || !schema.catsHasSlug);

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
            <button onClick={handleSignOut} data-testid="button-sign-out"
              className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground glass-card">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Migration banner */}
        {needsMigration && (
          <MigrationBanner
            missingVideoCols={!schema.videosHasLock}
            missingCatCols={!schema.catsHasSlug}
          />
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Videos", value: videos.length },
            { label: "Featured", value: videos.filter((v) => v.featured).length },
            { label: "Locked", value: schema.videosHasLock ? videos.filter((v) => v.is_locked).length : "—" },
            { label: "Categories", value: categories.length },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-5 gradient-border">
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 glass-card rounded-xl p-1 w-fit">
          {([
            { key: "videos", icon: VideoIcon, label: "Videos" },
            { key: "categories", icon: Tag, label: "Categories" },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setActiveTab(key)} data-testid={`tab-${key}`}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all"
              style={
                activeTab === key
                  ? { background: "linear-gradient(135deg, #f5c842, #d4a017)", color: "#0a0a0a" }
                  : { color: "rgba(255,255,255,0.5)" }
              }>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* ── VIDEOS TAB ── */}
        {activeTab === "videos" && (
          <div className="glass-card rounded-2xl overflow-hidden gradient-border">
            <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border">
              <div className="flex items-center gap-3">
                <VideoIcon className="w-5 h-5" style={{ color: "var(--gold)" }} />
                <h2 className="font-semibold text-foreground">Videos</h2>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{filteredVideos.length}</span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search videos..." data-testid="input-search"
                    className="w-full pl-9 pr-4 py-2 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>
                <button onClick={openAddVideo} data-testid="button-add-video"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all"
                  style={{ background: "linear-gradient(135deg, #f5c842, #d4a017)", color: "#0a0a0a" }}>
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
                      <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Locked</th>
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
                                <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
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
                          <span className="px-2 py-1 rounded-full text-xs text-muted-foreground" style={{ background: "var(--gold-dim)" }}>
                            {video.category || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground hidden lg:table-cell">{video.duration || "—"}</td>
                        <td className="px-4 py-4 text-center">
                          <button onClick={() => toggleFeatured(video)} data-testid={`button-featured-${video.id}`} className="transition-all hover:scale-110">
                            {video.featured
                              ? <Star className="w-4 h-4 fill-current" style={{ color: "var(--gold)" }} />
                              : <StarOff className="w-4 h-4 text-muted-foreground" />}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button onClick={() => toggleLocked(video)} data-testid={`button-locked-${video.id}`} className="transition-all hover:scale-110">
                            {video.is_locked
                              ? <Lock className="w-4 h-4" style={{ color: "var(--gold)" }} />
                              : <LockOpen className="w-4 h-4 text-muted-foreground" />}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEditVideo(video)} data-testid={`button-edit-${video.id}`}
                              className="p-2 rounded-lg text-muted-foreground hover:text-foreground glass-card transition-all">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteVideo(video.id)} disabled={deletingId === video.id}
                              data-testid={`button-delete-${video.id}`}
                              className="p-2 rounded-lg text-muted-foreground hover:text-red-400 glass-card transition-all disabled:opacity-50">
                              {deletingId === video.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
        )}

        {/* ── CATEGORIES TAB ── */}
        {activeTab === "categories" && (
          <div className="glass-card rounded-2xl overflow-hidden gradient-border">
            <div className="px-6 py-5 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5" style={{ color: "var(--gold)" }} />
                <h2 className="font-semibold text-foreground">Categories</h2>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{categories.length}</span>
              </div>
              <button onClick={openAddCategory} data-testid="button-add-category"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: "linear-gradient(135deg, #f5c842, #d4a017)", color: "#0a0a0a" }}>
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FolderOpen className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No categories yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {categories.map((cat) => {
                  const videoCount = videos.filter((v) => v.category === cat.name).length;
                  return (
                    <div key={cat.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors" data-testid={`row-category-${cat.id}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: "var(--gold-dim)", border: "1px solid rgba(245,200,66,0.15)" }}>
                          <Tag className="w-3.5 h-3.5" style={{ color: "var(--gold)" }} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{cat.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {cat.slug ? `/${cat.slug} · ` : ""}{videoCount} video{videoCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditCategory(cat)} data-testid={`button-edit-cat-${cat.id}`}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground glass-card transition-all">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteCategory(cat.id, cat.name)} disabled={deletingCatId === cat.id}
                          data-testid={`button-delete-cat-${cat.id}`}
                          className="p-2 rounded-lg text-muted-foreground hover:text-red-400 glass-card transition-all disabled:opacity-50">
                          {deletingCatId === cat.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── VIDEO MODAL ── */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="glass-card rounded-2xl w-full max-w-lg gradient-border overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 glass-card z-10">
              <h3 className="font-semibold text-foreground">{editingVideo ? "Edit Video" : "Add Video"}</h3>
              <button onClick={() => setShowVideoModal(false)} data-testid="button-close-modal"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground glass-card transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveVideo} className="p-6 space-y-4" data-testid="form-video">
              {([
                { label: "Title", key: "title", type: "text", required: true, placeholder: "Wedding Highlights — John & Jane" },
                { label: "YouTube URL", key: "youtube_url", type: "url", required: true, placeholder: "https://youtube.com/watch?v=..." },
                { label: "Thumbnail URL", key: "thumbnail_url", type: "url", required: false, placeholder: "https://..." },
                { label: "Duration", key: "duration", type: "text", required: false, placeholder: "3:45" },
              ] as const).map(({ label, key, type, required, placeholder }) => (
                <div key={key}>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
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
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  data-testid="select-category"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-foreground outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Featured toggle */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" checked={form.featured}
                    onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    data-testid="checkbox-featured" className="sr-only" />
                  <div className={`w-10 h-6 rounded-full transition-all ${form.featured ? "" : "bg-muted"}`}
                    style={form.featured ? { background: "linear-gradient(135deg, #f5c842, #d4a017)" } : {}}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.featured ? "left-5" : "left-1"}`} />
                  </div>
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Mark as Featured</span>
              </label>

              {/* Lock toggle — only shown when schema supports it */}
              {schema.videosHasLock && (
                <div className="rounded-xl p-4 space-y-4" style={{ background: "rgba(245,200,66,0.04)", border: "1px solid rgba(245,200,66,0.12)" }}>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input type="checkbox" checked={form.is_locked}
                        onChange={(e) => setForm((f) => ({ ...f, is_locked: e.target.checked }))}
                        data-testid="checkbox-locked" className="sr-only" />
                      <div className={`w-10 h-6 rounded-full transition-all ${form.is_locked ? "" : "bg-muted"}`}
                        style={form.is_locked ? { background: "linear-gradient(135deg, #f5c842, #d4a017)" } : {}}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.is_locked ? "left-5" : "left-1"}`} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5" style={{ color: form.is_locked ? "var(--gold)" : "rgba(255,255,255,0.4)" }} />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Password-protect this project</span>
                    </div>
                  </label>

                  {form.is_locked && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Project Password <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.project_password}
                          onChange={(e) => setForm((f) => ({ ...f, project_password: e.target.value }))}
                          placeholder="Set a password for this project"
                          data-testid="input-project-password"
                          className="w-full px-4 py-2.5 pr-10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                        />
                        <button type="button" onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">Visitors must enter this password to watch the video.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Show placeholder if migration not done yet */}
              {!schema.videosHasLock && schema.checked && (
                <div className="rounded-xl p-3 flex items-center gap-2 text-xs text-amber-400/70"
                  style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  Password protection unavailable — run the database migration first.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowVideoModal(false)} data-testid="button-cancel"
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium glass-card text-muted-foreground hover:text-foreground transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={saving} data-testid="button-save"
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #f5c842, #d4a017)", color: "#0a0a0a" }}>
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : (editingVideo ? "Save Changes" : "Add Video")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CATEGORY MODAL ── */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="glass-card rounded-2xl w-full max-w-sm gradient-border overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h3 className="font-semibold text-foreground">{editingCat ? "Edit Category" : "Add Category"}</h3>
              <button onClick={() => setShowCatModal(false)} data-testid="button-close-cat-modal"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground glass-card transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4" data-testid="form-category">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Name <span className="text-red-400">*</span></label>
                <input type="text" value={catForm.name}
                  onChange={(e) => setCatForm((f) => ({
                    ...f,
                    name: e.target.value,
                    slug: f.slug || e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
                  }))}
                  required placeholder="Wedding Films" data-testid="input-cat-name" autoFocus
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>

              {schema.catsHasSlug && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Slug</label>
                  <input type="text" value={catForm.slug}
                    onChange={(e) => setCatForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="wedding-films" data-testid="input-cat-slug"
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Auto-generated from name if left blank.</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCatModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium glass-card text-muted-foreground hover:text-foreground transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={savingCat} data-testid="button-save-cat"
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #f5c842, #d4a017)", color: "#0a0a0a" }}>
                  {savingCat ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : (editingCat ? "Save Changes" : "Add Category")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
