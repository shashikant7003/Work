import { Film, Award, Heart, Zap } from "lucide-react";

const skills = [
  { icon: Film, label: "Cinematic Editing", desc: "Grading, color science & storytelling" },
  { icon: Award, label: "Award-Winning", desc: "Recognized for quality and creativity" },
  { icon: Heart, label: "Passion-Driven", desc: "Every frame crafted with intention" },
  { icon: Zap, label: "Fast Turnaround", desc: "Meeting deadlines without compromise" },
];

const tools = ["Adobe Premiere Pro", "After Effects", "Photoshop", "Audition"];

export default function AboutSection() {
  return (
    <section id="about" className="py-24 px-6" data-testid="about-section">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 max-w-[40px]" style={{ background: "var(--gold)" }} />
              <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--gold)" }}>
                About RAK
              </span>
            </div>
            <h2 className="text-4xl font-black text-foreground tracking-tight mb-6 leading-tight">
              Turning raw footage into
              <span className="gold-text"> cinematic moments</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">1 Year of Turning Ideas into High-Impact Visuals
            Over the past year, I’ve been obsessed with one thing: making content that grabs attention and doesn't let go. From sharp pacing and seamless transitions to clean color grading and sound design, I transform raw footage into engaging stories. Whether it’s a fast-paced vlog or a premium brand video, I build timelines that connect with people.</p>
            <p className="text-muted-foreground leading-relaxed mb-10">
              My approach combines technical precision with artistic vision, ensuring every edit 
              serves the story and every color grade enhances the mood. I believe great editing 
              is invisible — you feel it before you notice it.
            </p>

            {/* Tools */}
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Tools I Use</p>
              <div className="flex flex-wrap gap-2">
                {tools.map((tool) => (
                  <span key={tool} className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Skill cards */}
          <div className="grid grid-cols-2 gap-4">
            {skills.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="glass-card rounded-2xl p-6 group hover:border-yellow-500/20 transition-all duration-300"
                data-testid={`card-skill-${label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                  style={{ background: "var(--gold-dim)" }}>
                  <Icon className="w-5 h-5" style={{ color: "var(--gold)" }} />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}

            {/* Quote card */}
            <div className="col-span-2 glass-card rounded-2xl p-6 gradient-border">
              <p className="text-sm text-foreground/80 leading-relaxed italic font-light">
                "The best edits are the ones that make you feel something before you realize what happened. 
                That's the magic I chase with every project."
              </p>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #f5c842, #d4a017)" }}>
                  <span className="text-xs font-black text-black">R</span>
                </div>
                <span className="text-sm font-semibold gold-text">RAK</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
