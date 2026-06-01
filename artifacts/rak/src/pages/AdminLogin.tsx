import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";

export default function AdminLogin() {
  const { signIn, isAdmin, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAdmin) {
      setLocation("/admin/dashboard");
    }
  }, [isAdmin, loading, setLocation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: "Login failed", description: error, variant: "destructive" });
    } else {
      setLocation("/admin/dashboard");
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background orbs */}
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

        {/* Card */}
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

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-admin-login">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@example.com"
                  data-testid="input-email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:ring-1"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    "--tw-ring-color": "var(--gold)",
                  } as React.CSSProperties}
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
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  data-testid="input-password"
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

            <button
              type="submit"
              disabled={submitting}
              data-testid="button-submit-login"
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
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
