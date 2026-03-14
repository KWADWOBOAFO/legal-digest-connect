import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PricingSection from "@/components/sections/PricingSection";
import { Check, X, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const comparisonFeatures = [
  { name: "Case matches per month", starter: "5", pro: "Unlimited", enterprise: "Unlimited" },
  { name: "Video consultations", starter: true, pro: true, enterprise: true },
  { name: "Client reviews & ratings", starter: true, pro: true, enterprise: true },
  { name: "Basic firm profile", starter: true, pro: true, enterprise: true },
  { name: "Priority listing in search", starter: false, pro: true, enterprise: true },
  { name: "Analytics dashboard", starter: false, pro: true, enterprise: true },
  { name: "AI-powered case insights", starter: false, pro: true, enterprise: true },
  { name: "Document sharing & annotations", starter: false, pro: true, enterprise: true },
  { name: "Calendar integrations", starter: false, pro: true, enterprise: true },
  { name: "Dedicated support", starter: false, pro: true, enterprise: true },
  { name: "Multi-seat team access", starter: false, pro: false, enterprise: true },
  { name: "Custom branding", starter: false, pro: false, enterprise: true },
  { name: "API access", starter: false, pro: false, enterprise: true },
  { name: "SLA & uptime guarantees", starter: false, pro: false, enterprise: true },
  { name: "Dedicated account manager", starter: false, pro: false, enterprise: true },
];

const faqs = [
  {
    question: "Can I switch plans at any time?",
    answer:
      "Yes. You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the change takes effect at the end of your current billing cycle.",
  },
  {
    question: "Is there a free trial for the Professional plan?",
    answer:
      "Yes! The Professional plan comes with a 14-day free trial. No credit card required to start. You'll get full access to all Professional features during the trial period.",
  },
  {
    question: "How does the case matching limit work on the Starter plan?",
    answer:
      "On the Starter plan, you'll receive up to 5 new case match notifications per month. You can accept or decline each match. Unused matches don't roll over to the next month.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards (Visa, Mastercard, American Express), as well as direct debit for annual plans. Enterprise plans can also be invoiced.",
  },
  {
    question: "Can I cancel my subscription?",
    answer:
      "Absolutely. You can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your current billing period. No cancellation fees.",
  },
  {
    question: "Do individuals need to pay to use the platform?",
    answer:
      "No. The platform is completely free for individuals seeking legal advice. You can submit cases, receive firm matches, and attend consultations at no cost.",
  },
];

const FeatureCell = ({ value }: { value: boolean | string }) => {
  if (typeof value === "string") {
    return <span className="text-sm font-medium text-foreground">{value}</span>;
  }
  return value ? (
    <Check className="w-5 h-5 text-success mx-auto" />
  ) : (
    <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
  );
};

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20">
        {/* Hero */}
        <div className="bg-primary text-primary-foreground py-16 text-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-primary-foreground/70 text-lg max-w-2xl mx-auto">
              Free for individuals. Flexible plans for law firms ready to grow their practice.
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <PricingSection showHeader={false} compact />

        {/* Feature Comparison Table */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-serif font-bold text-foreground text-center mb-12">
              Compare All Features
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 pr-4 text-sm font-medium text-muted-foreground w-2/5">
                      Feature
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-bold text-foreground w-1/5">
                      Starter
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-bold text-accent w-1/5">
                      Professional
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-bold text-foreground w-1/5">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, i) => (
                    <tr
                      key={feature.name}
                      className={cn(
                        "border-b border-border/50",
                        i % 2 === 0 ? "bg-muted/30" : ""
                      )}
                    >
                      <td className="py-3.5 pr-4 text-sm text-foreground">
                        {feature.name}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <FeatureCell value={feature.starter} />
                      </td>
                      <td className="py-3.5 px-4 text-center bg-accent/5">
                        <FeatureCell value={feature.pro} />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <FeatureCell value={feature.enterprise} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-muted">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                <HelpCircle className="w-5 h-5 text-accent" />
                <span className="text-accent font-semibold text-sm tracking-wider uppercase">
                  FAQ
                </span>
              </div>
              <h2 className="text-3xl font-serif font-bold text-foreground">
                Frequently Asked Questions
              </h2>
            </div>

            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="bg-card rounded-xl border border-border px-6 shadow-sm"
                >
                  <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
