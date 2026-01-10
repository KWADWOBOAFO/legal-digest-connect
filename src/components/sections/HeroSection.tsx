import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Users, Clock } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-hero-gradient overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="container mx-auto px-4 pt-32 pb-20 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-light/10 border border-gold-light/20 mb-8 animate-fade-up">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-gold-light text-sm font-medium">
              Trusted Legal Matching Platform
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-gold-light leading-tight mb-6 animate-fade-up delay-100">
            Your Legal Matter,{" "}
            <span className="text-gradient-gold">Debriefed</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-gold-light/70 max-w-3xl mx-auto mb-10 leading-relaxed animate-fade-up delay-200">
            Tell us your situation. We'll identify the exact area of law, match you with 
            specialized legal experts, and secure your free 30-minute consultation — all 
            while protecting your data with absolute confidentiality.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-up delay-300">
            <Button variant="hero" size="lg">
              Submit Your Case
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="hero-outline" size="lg">
              I'm a Law Firm
            </Button>
          </div>

          {/* Trust Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto animate-fade-up delay-400">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-accent" />
                <span className="text-3xl font-bold text-gold-light">500+</span>
              </div>
              <span className="text-gold-light/60 text-sm">Law Firms Registered</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-accent" />
                <span className="text-3xl font-bold text-gold-light">24hrs</span>
              </div>
              <span className="text-gold-light/60 text-sm">Average Match Time</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-accent" />
                <span className="text-3xl font-bold text-gold-light">100%</span>
              </div>
              <span className="text-gold-light/60 text-sm">Data Protected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
