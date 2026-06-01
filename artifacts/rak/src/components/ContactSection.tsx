import { SiInstagram, SiGmail, SiWhatsapp } from "react-icons/si";
import { MessageSquare } from "lucide-react";

const contacts = [
  {
    icon: SiInstagram,
    label: "Instagram",
    desc: "Follow my work",
    href: "https://instagram.com",
    color: "#E1306C",
    bg: "rgba(225, 48, 108, 0.1)",
    border: "rgba(225, 48, 108, 0.2)",
  },
  {
    icon: SiGmail,
    label: "Gmail",
    desc: "Send me an email",
    href: "mailto:rak@example.com",
    color: "#EA4335",
    bg: "rgba(234, 67, 53, 0.1)",
    border: "rgba(234, 67, 53, 0.2)",
  },
  {
    icon: SiWhatsapp,
    label: "WhatsApp",
    desc: "Chat directly",
    href: "https://wa.me/1234567890",
    color: "#25D366",
    bg: "rgba(37, 211, 102, 0.1)",
    border: "rgba(37, 211, 102, 0.2)",
  },
];

export default function ContactSection() {
  return (
    <section id="contact" className="py-24 px-6" data-testid="contact-section">
      <div className="max-w-4xl mx-auto text-center">
        {/* Header */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
          style={{ background: "var(--gold-dim)", border: "1px solid rgba(245,200,66,0.2)" }}>
          <MessageSquare className="w-6 h-6" style={{ color: "var(--gold)" }} />
        </div>
        <h2 className="text-4xl font-black text-foreground tracking-tight mb-4">
          Let's Create Something
          <span className="gold-text"> Extraordinary</span>
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-xl mx-auto mb-12">
          Ready to bring your vision to life? Reach out through any of these channels 
          and let's start the conversation.
        </p>

        {/* Contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {contacts.map(({ icon: Icon, label, desc, href, color, bg, border }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`link-contact-${label.toLowerCase()}`}
              className="group glass-card rounded-2xl p-8 flex flex-col items-center gap-4 transition-all duration-300 hover:scale-[1.03]"
              style={{ "--hover-border": border } as React.CSSProperties}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = border;
                (e.currentTarget as HTMLElement).style.background = bg;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "";
                (e.currentTarget as HTMLElement).style.background = "";
              }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                style={{ background: bg, border: `1px solid ${border}` }}>
                <Icon className="w-7 h-7" style={{ color }} />
              </div>
              <div>
                <p className="font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <span className="text-xs font-medium px-3 py-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100"
                style={{ background: bg, color, border: `1px solid ${border}` }}>
                Connect →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
