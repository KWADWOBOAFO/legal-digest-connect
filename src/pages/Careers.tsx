import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LegalBreadcrumb from "@/components/layout/LegalBreadcrumb";
import BackToTopButton from "@/components/layout/BackToTopButton";
import { ArrowRight, HeartHandshake, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const values = [
  { icon: Scale, title: "Access to justice", text: "We focus on making the route to regulated legal help clearer and less intimidating." },
  { icon: ShieldCheck, title: "Trust by design", text: "Privacy, professional verification and responsible handling of legal information shape how we work." },
  { icon: HeartHandshake, title: "People before process", text: "We design for people dealing with difficult circumstances and professionals responsible for helping them." },
];

const Careers = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <LegalBreadcrumb currentPage="Careers" />

        <h1 className="text-4xl font-serif font-bold text-foreground mb-4">
          Join Our Team
        </h1>
        <p className="text-lg text-muted-foreground mb-12 max-w-2xl">
          Help us bridge the gap between everyday people and excellent legal
          services. We're building the future of access to justice.
        </p>

        <section className="mb-16 grid gap-6 md:grid-cols-3">
          {values.map((value) => <article key={value.title} className="border-t-2 border-accent bg-card p-6 shadow-card"><value.icon className="mb-4 h-7 w-7 text-accent" /><h2 className="mb-3 text-xl font-bold">{value.title}</h2><p className="text-sm leading-relaxed text-muted-foreground">{value.text}</p></article>)}
        </section>

        <section className="mb-16 grid gap-10 border-y border-border py-10 md:grid-cols-2">
          <div><Sparkles className="mb-4 h-7 w-7 text-accent" /><h2 className="mb-3 text-2xl font-bold">How we hire</h2><p className="leading-relaxed text-muted-foreground">When roles are advertised, the process is designed to assess relevant skills fairly. Details about responsibilities, working arrangements and application stages will appear with each confirmed vacancy.</p></div>
          <div><h2 className="mb-3 text-2xl font-bold">Equal opportunity</h2><p className="leading-relaxed text-muted-foreground">Case Broker values different backgrounds and perspectives. Recruitment decisions are based on the requirements of the role and the applicant’s ability to contribute.</p></div>
        </section>

        <section className="bg-muted/50 p-8">
          <h2 className="mb-3 text-2xl font-bold">Current vacancies</h2>
          <p className="mb-6 text-muted-foreground">There are no confirmed vacancies listed at present. This page will show role-specific responsibilities and application instructions when recruitment opens.</p>
          <Button asChild variant="outline"><Link to="/contact">Contact Case Broker <ArrowRight /></Link></Button>
        </section>
      </main>
      <BackToTopButton />
      <Footer />
    </div>
  );
};

export default Careers;
