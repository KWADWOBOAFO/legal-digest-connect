import { useState } from "react";
import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/auth/AuthDialog";
  Users, Filter, Video, FileText, Star, Shield, 
  ArrowRight, Check 
} from "lucide-react";

const benefits = [
  {
    icon: Filter,
    title: "Pre-Qualified Leads",
    description: "Receive cases already categorized by practice area with detailed briefs.",
  },
  {
    icon: Video,
    title: "Integrated Video Consultations",
    description: "Conduct 30-minute consultations directly on our secure platform.",
  },
  {
    icon: FileText,
    title: "Smart Case Notes",
    description: "Take consultation notes and share summaries with clients instantly.",
  },
  {
    icon: Star,
    title: "Build Your Reputation",
    description: "Collect reviews and ratings to attract more quality clients.",
  },
  {
    icon: Users,
    title: "Location-Based Matching",
    description: "Connect with clients in your area or expand your reach nationwide.",
  },
  {
    icon: Shield,
    title: "NDA-Protected Data",
    description: "All firm partners sign NDAs. Client data is encrypted end-to-end.",
  },
];

const features = [
  "Accept or decline cases on your terms",
  "Set your availability and practice areas",
  "Access detailed case briefs before consultation",
  "Automated scheduling and reminders",
  "Secure document sharing",
  "Analytics dashboard",
];

const ForFirms = () => {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    <section id="for-firms" className="py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <span className="inline-block text-accent font-semibold text-sm tracking-wider uppercase mb-4">
              For Legal Professionals
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">
              Grow Your Practice with Pre-Qualified Clients
            </h2>
            <p className="text-primary-foreground/70 text-lg mb-8 leading-relaxed">
              Join 500+ law firms who save time on intake and focus on what matters — 
              practicing law. Our platform does the heavy lifting of case categorization 
              and client matching.
            </p>

            {/* Feature Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-primary-foreground/80 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="gold" size="lg" onClick={() => setAuthOpen(true)}>
                Join as a Firm
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                View Pricing
              </Button>
            </div>
          </div>

          {/* Right - Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className="bg-primary-foreground/5 backdrop-blur-sm rounded-xl p-6 border border-primary-foreground/10 hover:border-accent/30 transition-colors"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-serif text-lg font-bold mb-2">{benefit.title}</h3>
                <p className="text-primary-foreground/60 text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForFirms;
