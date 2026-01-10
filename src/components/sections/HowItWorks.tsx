import { FileText, Brain, Handshake, Video } from "lucide-react";

const steps = [
  {
    icon: FileText,
    step: "01",
    title: "Submit Your Matter",
    description:
      "Describe your legal situation in plain English. No legal jargon needed — just tell us what happened.",
  },
  {
    icon: Brain,
    step: "02",
    title: "Intelligent Analysis",
    description:
      "Our AI analyzes your case, identifies the relevant legal areas, and creates a comprehensive brief.",
  },
  {
    icon: Handshake,
    step: "03",
    title: "Expert Matching",
    description:
      "We match you with specialized law firms in your area who are best suited to handle your specific case.",
  },
  {
    icon: Video,
    step: "04",
    title: "Free Consultation",
    description:
      "Connect for a 30-minute video consultation. The firm decides if they'll take your case — you decide if they're right for you.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-accent font-semibold text-sm tracking-wider uppercase mb-4">
            Simple Process
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
            How Debriefed Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From confusion to clarity in four simple steps. We've streamlined the 
            process of finding the right legal help.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.step}
              className="relative group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-border">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-accent rounded-full" />
                </div>
              )}

              <div className="relative bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border group-hover:border-accent/30">
                {/* Step Number */}
                <span className="absolute -top-4 left-8 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">
                  {step.step}
                </span>

                {/* Icon */}
                <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/10 transition-colors">
                  <step.icon className="w-7 h-7 text-accent" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-serif font-bold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
