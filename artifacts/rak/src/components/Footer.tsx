import { Link } from "wouter";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border py-10 px-6" data-testid="footer">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #f5c842, #d4a017)" }}>
            <span className="text-xs font-black text-black">C</span>
          </div>
          <span className="font-bold gold-text">ChronoEdits</span>
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          Crafted with <Heart className="w-3 h-3 fill-current text-red-500" /> for visual storytelling
        </p>

        <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Admin Portal
        </Link>
      </div>
    </footer>
  );
}
