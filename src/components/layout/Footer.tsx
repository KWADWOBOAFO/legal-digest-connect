import { useState } from "react";
import { Scale, Twitter, Linkedin, Facebook, Instagram } from "lucide-react";
import ContactFormDialog from "./ContactFormDialog";

const footerLinks = {
  Platform: [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Practice Areas", href: "#practice-areas" },
    { label: "For Law Firms", href: "#for-firms" },
    { label: "Pricing", href: "#pricing" },
  ],
  Company: [
    { label: "About Us", href: "#about" },
    { label: "Careers", href: "#careers" },
    { label: "Blog", href: "#blog" },
    { label: "Contact", href: "#contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#privacy" },
    { label: "Terms of Service", href: "#terms" },
    { label: "Cookie Policy", href: "#cookies" },
    { label: "GDPR", href: "#gdpr" },
  ],
  Support: [
    { label: "Help Center", href: "#help" },
    { label: "FAQs", href: "#faqs" },
    { label: "Community", href: "#community" },
    { label: "Status", href: "#status" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Instagram, href: "#", label: "Instagram" },
];

const Footer = () => {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <ContactFormDialog open={contactOpen} onOpenChange={setContactOpen} />
      <footer className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-16">
          {/* Main Footer Content */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
            {/* Brand Column */}
            <div className="col-span-2">
              <a href="/" className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Scale className="w-5 h-5 text-accent-foreground" />
                </div>
                <span className="font-serif text-2xl font-bold">DEBRIEFED</span>
              </a>
              <p className="text-primary-foreground/60 text-sm mb-6 max-w-xs">
                Bridging the gap between everyday people and excellent legal services.
                Your matter, expertly matched.
              </p>
              {/* Social Links */}
              <div className="flex gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent/20 transition-colors"
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-semibold mb-4 text-sm">{category}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      {link.label === "Contact" ? (
                        <button
                          onClick={() => setContactOpen(true)}
                          className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors"
                        >
                          {link.label}
                        </button>
                      ) : (
                        <a
                          href={link.href}
                          className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-primary-foreground/60 text-sm">
              © {new Date().getFullYear()} Debriefed. All rights reserved.
            </p>
            <p className="text-primary-foreground/60 text-sm">
              Made with care for access to justice.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
