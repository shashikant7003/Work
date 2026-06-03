import { Play, ChevronDown } from "lucide-react";

type HeroProps = {
  onExplore: () => void;
};

export default function Hero({ onExplore }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" data-testid="hero-section">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #f5c842, transparent 70%)", animation: "float 8s ease-in-out infinite" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #f5c842, transparent 70%)", animation: "float 10s ease-in-out infinite 2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-[0.03]"
          style={{ background: "radial-gradient(circle, #ffffff, transparent 70%)" }} />
      </div>
      {/* Grid lines overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }} />
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-medium"
          style={{ background: "var(--gold-dim)", border: "1px solid rgba(245,200,66,0.2)", color: "var(--gold)" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--gold)" }} />
          Premium Video Editor
        </div>

        {/* Main heading */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none mb-6">
          <span className="text-foreground">Turning Chaos Into</span>
          <br />
          <span className="gold-text">Beautiful</span>
          <br />
          <span className="text-foreground">Memories</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed font-light">I'm  — a video editor specializing in cinematic storytelling, wedding films, and branded content that leaves an impression.</p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onExplore}
            data-testid="button-explore-work"
            className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 hover:opacity-90 hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #f5c842, #d4a017)", color: "#0a0a0a" }}
          >
            <Play className="w-4 h-4 fill-current transition-transform group-hover:scale-110" />
            Explore My Work
          </button>
          <button
            onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
            data-testid="button-get-in-touch"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-semibold glass-card transition-all duration-300 hover:border-yellow-500/30"
          >
            Get in Touch
          </button>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {[
            { value: "100+", label: "Projects" },
            { value: "1 yr", label: "Experience" },
            { value: "100%", label: "Satisfaction" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-black gold-text">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Scroll indicator */}
      <button
        onClick={onExplore}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        data-testid="button-scroll-down"
        style={{ animation: "float 2s ease-in-out infinite" }}
      >
        <span className="text-xs">Scroll</span>
        <ChevronDown className="w-4 h-4" />
      </button>
    </section>
  );
}
