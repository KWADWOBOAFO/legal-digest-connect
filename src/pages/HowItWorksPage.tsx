import { Link } from "react-router-dom";
import { ArrowRight, Brain, CheckCircle2, FileText, Handshake, Scale, ShieldCheck, Video } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LegalBreadcrumb from "@/components/layout/LegalBreadcrumb";
import BackToTopButton from "@/components/layout/BackToTopButton";
import { Button } from "@/components/ui/button";

const journey = [
  { icon: FileText, number: "01", title: "Tell us about your matter", text: "Create an account and describe what has happened in your own words. Add relevant dates, urgency and supporting documents when available." },
  { icon: Brain, number: "02", title: "Your matter is organised", text: "Case Broker analyses the information, identifies likely practice areas and prepares a structured brief for suitable regulated professionals." },
  { icon: Handshake, number: "03", title: "Interested firms respond", text: "More than one matched firm can indicate interest. Before choosing, compare consultation prices, relevant experience, reviews, awards and profile information." },
  { icon: Video, number: "04", title: "Book a video consultation", text: "Choose the firm that suits you, pay the stated consultation charge and meet through Case Broker’s video consultation service." },
];

const HowItWorksPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-20">
      <section className="bg-primary py-16 text-primary-foreground md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <LegalBreadcrumb currentPage="How It Works" />
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase text-accent">A clear route to legal help</p>
            <h1 className="mb-6 text-4xl font-bold md:text-6xl">How Case Broker Works</h1>
            <p className="text-lg leading-relaxed text-primary-foreground/75 md:text-xl">
              Submit your legal matter once, hear from suitable regulated firms and make an informed choice before booking a secure video consultation.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-6 md:grid-cols-2">
            {journey.map((step) => (
              <article key={step.number} className="border-t-2 border-accent bg-card p-7 shadow-card">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                    <step.icon className="h-6 w-6 text-accent" />
                  </div>
                  <span className="text-3xl font-bold text-muted-foreground/30">{step.number}</span>
                </div>
                <h2 className="mb-3 text-2xl font-bold">{step.title}</h2>
                <p className="leading-relaxed text-muted-foreground">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/40 py-20">
        <div className="container mx-auto grid max-w-5xl gap-12 px-4 lg:grid-cols-2">
          <div>
            <Scale className="mb-5 h-9 w-9 text-accent" />
            <h2 className="mb-4 text-3xl font-bold">You remain in control</h2>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              A match is not a recommendation and does not create a solicitor-client relationship. You decide which interested firm to consult and whether to instruct it afterwards.
            </p>
            <ul className="space-y-3">
              {["Compare firms before paying", "See the consultation price before booking", "No obligation to retain a firm after the consultation"].map((item) => (
                <li key={item} className="flex gap-3 text-foreground"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <ShieldCheck className="mb-5 h-9 w-9 text-accent" />
            <h2 className="mb-4 text-3xl font-bold">Privacy at every stage</h2>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              Pending matters are anonymised. Firms receive full details only through the controlled matching process, and participating firms must complete verification and sign the platform NDA.
            </p>
            <p className="leading-relaxed text-muted-foreground">
              Case Broker is a matching platform, not a law firm. Legal advice is provided only by the independent professional you choose.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 text-center">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-4 text-3xl font-bold">Ready to find the right legal professional?</h2>
          <p className="mb-8 text-muted-foreground">Create an individual account and start describing your matter.</p>
          <Button asChild variant="gold" size="lg"><Link to="/auth?mode=signup">Get started <ArrowRight /></Link></Button>
        </div>
      </section>
    </main>
    <BackToTopButton />
    <Footer />
  </div>
);

export default HowItWorksPage;