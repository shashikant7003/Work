import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Work", href: "#gallery" },
  { label: "Featured", href: "#featured" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollTo(id: string) {
    const el = document.querySelector(id);
    el?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(10,10,10,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      }}
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group" data-testid="link-home">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center gold-glow transition-transform group-hover:scale-105"
            style={{ background: "linear-gradient(135deg, #f5c842, #d4a017)" }}>
            <span className="text-lg font-black text-black">R</span>
          </div>
          <span className="text-lg font-black tracking-tight gold-text">RAK</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              data-testid={`link-nav-${link.label.toLowerCase()}`}
            >
              {link.label}
            </button>
          ))}
          <Link href="/admin"
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #f5c842, #d4a017)", color: "#0a0a0a" }}
            data-testid="link-admin">
            Admin
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg glass-card text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          data-testid="button-mobile-menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass-card border-t border-border px-6 py-4 space-y-3">
          {links.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="block w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              data-testid={`link-mobile-${link.label.toLowerCase()}`}
            >
              {link.label}
            </button>
          ))}
          <Link href="/admin"
            className="block w-full text-center px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "linear-gradient(135deg, #f5c842, #d4a017)", color: "#0a0a0a" }}>
            Admin Portal
          </Link>
        </div>
      )}
    </nav>
  );
}
