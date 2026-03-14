import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Building2, ArrowRight } from "lucide-react";
import AuthDialog from "@/components/auth/AuthDialog";
import { cn } from "@/lib/utils";

interface PricingTier {
  name: string;
  icon: typeof Zap;
  price: { monthly: string; annual: string };
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

const tiers: PricingTier[] = [
  {
    name: "Starter",
    icon: Zap,
    price: { monthly: "Free", annual: "Free" },
    description: "Get started with essential case matching and build your presence.",
    features: [
      "Up to 5 case matches per month",
      "Basic firm profile",
      "Video consultations",
      "Client reviews & ratings",
      "Email notifications",
    ],
    cta: "Get Started Free",
  },
  {
    name: "Professional",
    icon: Crown,
    price: { monthly: "£99", annual: "£79" },
    description: "For growing firms who want priority access and advanced tools.",
    features: [
      "Unlimited case matches",
      "Priority listing in search",
      "Advanced analytics dashboard",
      "AI-powered case insights",
      "Document sharing & annotations",
      "Calendar integrations",
      "Dedicated support",
    ],
    highlighted: true,
    cta: "Start Free Trial",
  },
  {
    name: "Enterprise",
    icon: Building2,
    price: { monthly: "Custom", annual: "Custom" },
    description: "For large firms needing tailored solutions and multi-seat access.",
    features: [
      "Everything in Professional",
      "Multi-seat team access",
      "Custom branding",
      "API access",
      "SLA & uptime guarantees",
      "Dedicated account manager",
      "Custom integrations",
    ],
    cta: "Contact Sales",
  },
];

interface PricingSectionProps {
  showHeader?: boolean;
  compact?: boolean;
}

const PricingSection = ({ showHeader = true, compact = false }: PricingSectionProps) => {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <section id="pricing" className={cn("bg-muted", compact ? "py-16" : "py-24")}>
        <div className="container mx-auto px-4">
          {showHeader && (
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="inline-block text-accent font-semibold text-sm tracking-wider uppercase mb-4">
                Pricing
              </span>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
                Plans That Scale with Your Firm
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Start free, upgrade when you're ready. No hidden fees, cancel anytime.
              </p>
            </div>
          )}

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <button
              onClick={() => setBilling("monthly")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                billing === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                billing === "annual"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Annual
              <span className="ml-2 text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={cn(
                  "relative rounded-2xl p-8 transition-all duration-300",
                  tier.highlighted
                    ? "bg-primary text-primary-foreground shadow-lg scale-[1.02] border-2 border-accent"
                    : "bg-card text-card-foreground shadow-card border border-border hover:shadow-card-hover"
                )}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-accent text-accent-foreground text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                      tier.highlighted ? "bg-accent/20" : "bg-primary/10"
                    )}
                  >
                    <tier.icon
                      className={cn(
                        "w-6 h-6",
                        tier.highlighted ? "text-accent" : "text-primary"
                      )}
                    />
                  </div>
                  <h3 className="font-serif text-2xl font-bold">{tier.name}</h3>
                  <p
                    className={cn(
                      "text-sm mt-1",
                      tier.highlighted
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {tier.description}
                  </p>
                </div>

                <div className="mb-8">
                  <span className="text-4xl font-bold">
                    {billing === "monthly" ? tier.price.monthly : tier.price.annual}
                  </span>
                  {tier.price.monthly !== "Free" && tier.price.monthly !== "Custom" && (
                    <span
                      className={cn(
                        "text-sm ml-1",
                        tier.highlighted
                          ? "text-primary-foreground/60"
                          : "text-muted-foreground"
                      )}
                    >
                      /month
                    </span>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className={cn(
                          "w-5 h-5 mt-0.5 flex-shrink-0",
                          tier.highlighted ? "text-accent" : "text-success"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm",
                          tier.highlighted
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        )}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={tier.highlighted ? "gold" : "outline"}
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    if (tier.name === "Enterprise") {
                      // Could open a contact form
                      navigate("/pricing");
                    } else {
                      setAuthOpen(true);
                    }
                  }}
                >
                  {tier.cta}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {!compact && (
            <div className="text-center mt-10">
              <button
                onClick={() => navigate("/pricing")}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
              >
                Compare all features in detail →
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default PricingSection;
