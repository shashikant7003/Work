import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";
import { Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, XCircle, ChevronDown } from "lucide-react";

// ─── Direct fetch auth (bypasses SDK — cannot hang silently) ──────────────────
type FetchAuthResult =
  | { ok: true; accessToken: string; refreshToken: string; email: string }
  | { ok: false; error: string };

async function fetchSignIn(email: string, password: string): Promise<FetchAuthResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: body?.error_description || body?.msg || body?.error || `HTTP ${res.status}` };
    }
    return { ok: true, accessToken: body.access_token, refreshToken: body.refresh_token, email: body.user?.email ?? email };
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: "Request timed out after 10 seconds. Supabase may be unreachable or paused." };
    }
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Admin table check via direct fetch ───────────────────────────────────────
type AdminCheckResult = { ok: true; found: boolean } | { ok: false; error: string };

async function fetchAdminCheck(email: string, accessToken: string): Promise<AdminCheckResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const url = `${SUPABASE_URL}/rest/v1/admins?select=id&email=eq.${encodeURIComponent(email)}&limit=1`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, error: `Admins table error (HTTP ${res.status}): ${JSON.stringify(body)}` };
    }
    return { ok: true, found: Array.isArray(body) && body.length > 0 };
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: "Admins table query timed out." };
    }
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Debug panel ──────────────────────────────────────────────────────────────
type LogEntry = { msg: string; status: "info" | "ok" | "fail" | "running" };

function DebugPanel({ logs }: { logs: LogEntry[] }) {
  const [open, setOpen] = useState(false);
  if (logs.length === 0) return null;
  return (
    <div className="mt-4 rounded-xl overflow-hidden text-xs"
      style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.3)" }}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-muted-foreground hover:text-foreground transition-colors">
        <span className="font-mono font-medium">Debug log ({logs.length} entries)</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-1.5 border-t border-white/[0.06]">
          <div className="pt-2.5 space-y-1">
            {logs.map((l, i) => (
              <div key={i} className="flex items-start gap-2 font-mono">
                {l.status === "ok" && <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />}
                {l.status === "fail" && <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />}
                {l.status === "running" && <Loader2 className="w-3 h-3 text-yellow-400 animate-spin mt-0.5 flex-shrink-0" />}
                {l.status === "info" && <span className="w-3 h-3 flex-shrink-0 mt-0.5 text-center text-muted-foreground">·</span>}
                <span className={
                  l.status === "ok" ? "text-green-400" :
                  l.status === "fail" ? "text-red-400" :
                  l.status === "running" ? "text-yellow-400" :
                  "text-muted-foreground"
                }>
                  {l.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
import { supabase } from "@/lib/supabase";

export default function AdminLogin() {
  const { isAdmin, setIsAdmin } = useAuth();
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const urlOk = SUPABASE_URL.startsWith("https://");
  const keyOk = SUPABASE_ANON_KEY.length > 20;

  useEffect(() => {
    if (isAdmin) setLocation("/admin/dashboard");
  }, [isAdmin, setLocation]);

  function addLog(msg: string, status: LogEntry["status"]) {
    setLogs((prev) => [...prev, { msg, status }]);
  }
  function updateLastLog(msg: string, status: LogEntry["status"]) {
    setLogs((prev) => { const next = [...prev]; if (next.length > 0) next[next.length - 1] = { msg, status }; return next; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLogs([]);
    setSubmitting(true);

    try {
      // Config check (shows presence, never value)
      addLog(`Supabase URL: ${SUPABASE_URL}`, urlOk ? "info" : "fail");
      addLog(`Anon key: ${keyOk ? `present (${SUPABASE_ANON_KEY.length} chars)` : "MISSING"}`, keyOk ? "info" : "fail");

      if (!urlOk || !keyOk) {
        setErrorMsg("Supabase is not configured correctly. Check environment variables.");
        return;
      }

      // Step 1: Auth
      addLog("Step 1/3 — Authenticating with Supabase…", "running");
      const authResult = await fetchSignIn(email, password);
      if (!authResult.ok) {
        updateLastLog(`Step 1/3 — Auth failed: ${authResult.error}`, "fail");
        setErrorMsg(authResult.error);
        return;
      }
      updateLastLog(`Step 1/3 — Auth OK`, "ok");

      // Step 2: Set session
      addLog("Step 2/3 — Setting session…", "running");
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: authResult.accessToken,
        refresh_token: authResult.refreshToken,
      });
      if (sessionError) {
        updateLastLog(`Step 2/3 — Session failed: ${sessionError.message}`, "fail");
        setErrorMsg(sessionError.message);
        return;
      }
      updateLastLog("Step 2/3 — Session set", "ok");

      // Step 3: Verify admin
      addLog("Step 3/3 — Verifying admin access…", "running");
      const adminResult = await fetchAdminCheck(authResult.email, authResult.accessToken);
      if (!adminResult.ok) {
        updateLastLog(`Step 3/3 — Verification error: ${adminResult.error}`, "fail");
        setErrorMsg(`Admin check failed: ${adminResult.error}`);
        await supabase.auth.signOut();
        return;
      }
      if (!adminResult.found) {
        updateLastLog(`Step 3/3 — Not an admin`, "fail");
        setErrorMsg(`"${authResult.email}" is not registered as an admin.`);
        await supabase.auth.signOut();
        return;
      }

      updateLastLog("Step 3/3 — Admin verified", "ok");
      addLog("Login complete", "ok");
      setIsAdmin(true);
      setLocation("/admin/dashboard");

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog(`Unexpected error: ${msg}`, "fail");
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5 blur-3xl"
        style={{ background: "radial-gradient(circle, #f5c842, transparent)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-5 blur-3xl"
        style={{ background: "radial-gradient(circle, #f5c842, transparent)" }} />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass-card mb-4 gold-glow">
            <span className="text-2xl font-black gold-text">R</span>
          </div>
          <h1 className="text-3xl font-black gold-text tracking-tight">RAK</h1>
          <p className="text-muted-foreground mt-1 text-sm">Admin Portal</p>
        </div>

        {/* Config status strip */}
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 rounded-xl text-xs font-mono"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <span className={urlOk ? "text-green-400" : "text-red-400"}>{urlOk ? "✓" : "✗"} URL</span>
          <span className="text-muted-foreground/30">|</span>
          <span className={keyOk ? "text-green-400" : "text-red-400"}>{keyOk ? "✓" : "✗"} Key</span>
          <span className="text-muted-foreground/30">|</span>
          <span className="text-muted-foreground truncate">{SUPABASE_URL.replace("https://", "")}</span>
        </div>

        <div className="glass-card rounded-2xl p-8 gradient-border">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg" style={{ background: "var(--gold-dim)" }}>
              <Lock className="w-5 h-5" style={{ color: "var(--gold)" }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Sign In</h2>
              <p className="text-xs text-muted-foreground">Authorized admins only</p>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5 text-sm"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
              data-testid="login-error">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-red-400 whitespace-pre-wrap break-all">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-admin-login">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMsg(null); }}
                  required placeholder="admin@example.com"
                  data-testid="input-email" autoComplete="email" maxLength={254}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMsg(null); }}
                  required placeholder="••••••••"
                  data-testid="input-password" autoComplete="current-password" maxLength={128}
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-toggle-password">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={submitting} data-testid="button-submit-login"
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ background: "linear-gradient(135deg, #f5c842, #d4a017)", color: "#0a0a0a" }}>
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : "Sign In"}
            </button>
          </form>

          <DebugPanel logs={logs} />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <a href="/" className="hover:text-foreground transition-colors">← Back to portfolio</a>
        </p>
      </div>
    </div>
  );
}
