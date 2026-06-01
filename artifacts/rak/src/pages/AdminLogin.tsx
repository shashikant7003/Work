import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

type Step = {
  label: string;
  status: "pending" | "running" | "ok" | "fail";
  detail?: string;
};

export default function AdminLogin() {
  const { signIn, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    if (isAdmin) setLocation("/admin/dashboard");
  }, [isAdmin, setLocation]);

  function setStepStatus(
    index: number,
    status: Step["status"],
    detail?: string
  ) {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], status, detail };
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const initialSteps: Step[] = [
      { label: "Connecting to Supabase Auth", status: "pending" },
      { label: "Verifying admin access", status: "pending" },
    ];
    setSteps(initialSteps);
    setSubmitting(true);

    try {
      // Show step 1 running
      setStepStatus(0, "running");

      const { error, step } = await signIn(email, password);

      if (error) {
        // Mark the failing step
        if (step === "supabase_auth") {
          setStepStatus(0, "fail", error);
          setStepStatus(1, "pending");
        } else if (step === "admins_query" || step === "not_admin") {
          setStepStatus(0, "ok");
          setStepStatus(1, "fail", error);
        } else {
          setStepStatus(0, "fail", error);
        }
        setErrorMsg(error);
        return;
      }

      // Success
      setStepStatus(0, "ok");
      setStepStatus(1, "ok", "Admin verified");
      setLocation("/admin/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMsg(msg);
      setStepStatus(0, "fail", msg);
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
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass-card mb-4 gold-glow">
            <span className="text-2xl font-black gold-text">R</span>
          </div>
          <h1 className="text-3xl font-black gold-text tracking-tight">RAK</h1>
          <p className="text-muted-foreground mt-1 text-sm">Admin Portal</p>
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

          {/* Error banner */}
          {errorMsg && (
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-xl mb-6 text-sm"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
              data-testid="login-error"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-red-400 break-all">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-admin-login">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMsg(null); setSteps([]); }}
                  required
                  placeholder="admin@example.com"
                  data-testid="input-email"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMsg(null); setSteps([]); }}
                  required
                  placeholder="••••••••"
                  data-testid="input-password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Step-by-step progress shown while submitting or after failure */}
            {steps.length > 0 && (
              <div className="space-y-2 py-1" data-testid="login-steps">
                {steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                      {s.status === "running" && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--gold)" }} />
                      )}
                      {s.status === "ok" && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      )}
                      {s.status === "fail" && (
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                      )}
                      {s.status === "pending" && (
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                      )}
                    </div>
                    <div>
                      <span className={
                        s.status === "ok" ? "text-green-400" :
                        s.status === "fail" ? "text-red-400" :
                        s.status === "running" ? "text-foreground" :
                        "text-muted-foreground/50"
                      }>
                        {s.label}
                      </span>
                      {s.detail && s.status !== "ok" && (
                        <p className="text-red-400/80 mt-0.5 break-all">{s.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              data-testid="button-submit-login"
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
              style={{
                background: "linear-gradient(135deg, #f5c842, #d4a017)",
                color: "#0a0a0a",
              }}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <a href="/" className="hover:text-foreground transition-colors">← Back to portfolio</a>
        </p>
      </div>
    </div>
  );
}
