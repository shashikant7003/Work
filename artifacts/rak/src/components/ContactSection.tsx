import { SiInstagram, SiGmail, SiWhatsapp } from "react-icons/si";
import { MessageSquare } from "lucide-react";

const contacts = [
  {
    icon: SiInstagram,
    label: "Instagram",
    desc: "Follow my work",
    sub: "@surajsa_68",
    href: "https://www.instagram.com/surajsa_68?igsh=MWowdngxeXlld3Btaw==",
    newTab: true,
    color: "#E1306C",
    glow: "rgba(225, 48, 108, 0.18)",
    bg: "rgba(225, 48, 108, 0.08)",
    bgHover: "rgba(225, 48, 108, 0.14)",
    border: "rgba(225, 48, 108, 0.18)",
    borderHover: "rgba(225, 48, 108, 0.45)",
  },
  {
    icon: SiGmail,
    label: "Gmail",
    desc: "Send me an email",
    sub: "surajsalodiya1@gmail.com",
    href: "mailto:surajsalodiya1@gmail.com",
    newTab: false,
    color: "#EA4335",
    glow: "rgba(234, 67, 53, 0.18)",
    bg: "rgba(234, 67, 53, 0.08)",
    bgHover: "rgba(234, 67, 53, 0.14)",
    border: "rgba(234, 67, 53, 0.18)",
    borderHover: "rgba(234, 67, 53, 0.45)",
  },
  {
    icon: SiWhatsapp,
    label: "WhatsApp",
    desc: "Chat directly",
    sub: "+91 85888 13701",
    href: "https://wa.me/918588813701",
    newTab: true,
    color: "#25D366",
    glow: "rgba(37, 211, 102, 0.18)",
    bg: "rgba(37, 211, 102, 0.08)",
    bgHover: "rgba(37, 211, 102, 0.14)",
    border: "rgba(37, 211, 102, 0.18)",
    borderHover: "rgba(37, 211, 102, 0.45)",
  },
];

export default function ContactSection() {
  return (
    <section id="contact" className="py-24 px-6" data-testid="contact-section">
      <div className="max-w-4xl mx-auto text-center">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
          style={{ background: "var(--gold-dim)", border: "1px solid rgba(245,200,66,0.2)" }}
        >
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {contacts.map(({ icon: Icon, label, desc, sub, href, newTab, color, glow, bg, bgHover, border, borderHover }) => (
            <a
              key={label}
              href={href}
              target={newTab ? "_blank" : undefined}
              rel={newTab ? "noopener noreferrer" : undefined}
              data-testid={`link-contact-${label.toLowerCase()}`}
              className="group glass-card rounded-2xl p-8 flex flex-col items-center gap-3 transition-all duration-300 cursor-pointer select-none"
              style={{
                border: `1px solid ${border}`,
                background: bg,
                WebkitTapHighlightColor: "transparent",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = borderHover;
                el.style.background = bgHover;
                el.style.transform = "scale(1.035) translateY(-2px)";
                el.style.boxShadow = `0 8px 32px ${glow}, 0 0 0 1px ${borderHover}`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = border;
                el.style.background = bg;
                el.style.transform = "";
                el.style.boxShadow = "";
              }}
              onMouseDown={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "scale(0.975)";
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "scale(1.035) translateY(-2px)";
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{
                  background: bgHover,
                  border: `1px solid ${border}`,
                  boxShadow: `0 0 24px ${glow}`,
                }}
              >
                <Icon className="w-8 h-8" style={{ color }} />
              </div>

              <div className="text-center">
                <p className="font-semibold text-foreground text-base">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>

              <p
                className="text-xs font-medium px-3 py-1.5 rounded-full"
                style={{
                  background: bgHover,
                  color,
                  border: `1px solid ${border}`,
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {sub}
              </p>

              <span
                className="text-xs font-semibold px-4 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 -mt-1"
                style={{ background: color, color: "#fff" }}
              >
                Open →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
