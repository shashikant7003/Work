import { Link } from "wouter";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full opacity-5 blur-3xl"
        style={{ background: "radial-gradient(circle, #f5c842, transparent)" }} />
      <div className="text-center relative z-10">
        <p className="text-8xl font-black gold-text mb-4">404</p>
        <h1 className="text-2xl font-bold text-foreground mb-3">Page Not Found</h1>
        <p className="text-muted-foreground mb-8 text-sm">This page doesn't exist or was moved.</p>
        <Link href="/">
          <a className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "linear-gradient(135deg, #f5c842, #d4a017)", color: "#0a0a0a" }}>
            <Home className="w-4 h-4" /> Back to Portfolio
          </a>
        </Link>
      </div>
    </div>
  );
}
