import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, BarChart3, CheckCircle2, FileSignature, Handshake, Percent, Scale, ShieldCheck, Video } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LegalBreadcrumb from "@/components/layout/LegalBreadcrumb";
import BackToTopButton from "@/components/layout/BackToTopButton";
import { Button } from "@/components/ui/button";

const onboarding = [
  { icon: Scale, title: "Create the firm profile", text: "Add the organisation, professionals, practice areas, consultation charge, website and public review links." },
  { icon: BadgeCheck, title: "Complete regulatory checks", text: "Provide the relevant regulator and registration details so the firm can be checked against the applicable published register." },
  { icon: FileSignature, title: "Sign the NDA", text: "The NDA protects client matter information. Administrators can see the signed status and review the application." },
  { icon: ShieldCheck, title: "Receive approval", text: "After successful verification and approval, the registered firm email receives confirmation and eligible case matches become available." },
];

const benefits = [
  { icon: Handshake, title: "Relevant opportunities", text: "Review structured matters aligned with your selected practice areas and indicate interest when the firm is a suitable fit." },
  { icon: BarChart3, title: "A profile clients can compare", text: "Present experience, consultation pricing, recognised awards and nominations, and links to public review pages." },
  { icon: Video, title: "Video-first consultations", text: "All consultations booked through Case Broker take place by video. Phone and in-person consultations are not offered through the platform." },
];

const ForLawFirmsPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-20">
      <section className="bg-primary py-16 text-primary-foreground md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <LegalBreadcrumb currentPage="For Law Firms" />
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase text-accent">For regulated legal professionals</p>
            <h1 className="mb-6 text-4xl font-bold md:text-6xl">Meet Clients Looking for Your Expertise</h1>
            <p className="mb-8 text-lg leading-relaxed text-primary-foreground/75">
              Receive suitable legal matters, show prospective clients why your firm stands out and conduct paid video consultations through one controlled platform.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="gold" size="lg"><Link to="/auth?mode=signup">Register your firm <ArrowRight /></Link></Button>
              <Button asChild variant="hero-outline" size="lg"><Link to="/pricing">View pricing</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-12 max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase text-accent">Joining Case Broker</p>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Verification before access</h2>
            <p className="text-lg text-muted-foreground">Firm access follows a clear approval process. The dashboard shows each stage and updates when the NDA or verification status changes.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {onboarding.map((item, index) => (
              <article key={item.title} className="border-t-2 border-accent bg-card p-6 shadow-card">
                <div className="mb-5 flex items-center justify-between"><item.icon className="h-7 w-7 text-accent" /><span className="text-sm font-bold text-muted-foreground">0{index + 1}</span></div>
                <h3 className="mb-3 text-xl font-bold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/40 py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="bg-background p-7 ring-1 ring-border">
                <benefit.icon className="mb-5 h-8 w-8 text-accent" />
                <h2 className="mb-3 text-2xl font-bold">{benefit.title}</h2>
                <p className="leading-relaxed text-muted-foreground">{benefit.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto grid max-w-5xl gap-12 px-4 lg:grid-cols-2 lg:items-start">
          <div>
            <Percent className="mb-5 h-9 w-9 text-accent" />
            <h2 className="mb-4 text-3xl font-bold">Commercial terms</h2>
            <p className="mb-6 leading-relaxed text-muted-foreground">Subscription plans cover access and platform features. Case Broker also deducts a 20% commission when a client pays for and books a consultation transaction through the platform.</p>
            <Button asChild variant="outline"><Link to="/pricing">Compare firm plans <ArrowRight /></Link></Button>
          </div>
          <div>
            <h2 className="mb-5 text-3xl font-bold">What clients can consider</h2>
            <ul className="space-y-4">
              {["Your stated consultation charge", "Relevant experience and practice areas", "Regulatory verification status", "Public review links, including Trustpilot and Google", "Awards, nominations and wins added to the profile"].map((item) => (
                <li key={item} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><span className="text-muted-foreground">{item}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
    <BackToTopButton />
    <Footer />
  </div>
);

export default ForLawFirmsPage;