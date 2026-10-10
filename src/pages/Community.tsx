import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LegalBreadcrumb from "@/components/layout/LegalBreadcrumb";
import BackToTopButton from "@/components/layout/BackToTopButton";
import { Link } from "react-router-dom";
import { BookOpen, MessageSquareText, Scale, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const principles = [
  { icon: ShieldCheck, title: "Protect confidentiality", text: "Do not publish names, documents or facts that could identify a client, legal professional or active matter." },
  { icon: MessageSquareText, title: "Share responsibly", text: "General experiences can help others, but community information must never be presented as personalised legal advice." },
  { icon: Scale, title: "Respect professional boundaries", text: "Only appropriately regulated professionals should describe themselves as qualified to advise in a particular jurisdiction." },
];

const Community = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <LegalBreadcrumb currentPage="Community" />
        <div className="max-w-3xl mb-14">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">Community</h1>
          <p className="text-muted-foreground text-lg">
            Case Broker brings individuals and regulated legal professionals together around a shared goal: clearer, safer access to legal support.
          </p>
        </div>

        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3"><Users className="h-7 w-7 text-accent" /><h2 className="text-2xl font-bold">Community standards</h2></div>
          <div className="grid gap-6 md:grid-cols-3">
            {principles.map((principle) => <article key={principle.title} className="border-t-2 border-accent bg-card p-6 shadow-card"><principle.icon className="mb-4 h-7 w-7 text-accent" /><h3 className="mb-3 text-xl font-bold">{principle.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{principle.text}</p></article>)}
          </div>
        </section>

        <section className="border-y border-border py-10">
          <BookOpen className="mb-4 h-7 w-7 text-accent" />
          <h2 className="mb-3 text-2xl font-bold">Useful places to continue</h2>
          <p className="mb-6 max-w-2xl text-muted-foreground">Use our public guidance to understand the matching process, explore legal practice areas or read answers to common questions.</p>
          <div className="flex flex-wrap gap-3"><Button asChild variant="outline"><Link to="/how-it-works">How it works</Link></Button><Button asChild variant="outline"><Link to="/practice-areas">Practice areas</Link></Button><Button asChild variant="gold"><Link to="/faqs">Read FAQs</Link></Button></div>
        </section>
      </main>
      <BackToTopButton />
      <Footer />
    </div>
  );
};

export default Community;
