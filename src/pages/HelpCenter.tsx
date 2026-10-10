import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LegalBreadcrumb from "@/components/layout/LegalBreadcrumb";
import BackToTopButton from "@/components/layout/BackToTopButton";
import { Link } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, FileQuestion, LifeBuoy, LockKeyhole, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

const helpTopics = [
  { icon: UserRound, title: "For individuals", items: ["Creating and securing your account", "Submitting and updating a legal matter", "Comparing interested firms and consultation charges", "Booking and joining a video consultation"] },
  { icon: BriefcaseBusiness, title: "For law firms", items: ["Completing the firm profile", "Regulator checks, NDA and approval status", "Responding to suitable matters", "Managing video consultations and client communications"] },
  { icon: LockKeyhole, title: "Privacy and safety", items: ["Who can see a pending matter", "Secure document access and sharing", "Reporting an account or data concern", "Exercising your data protection rights"] },
];

const HelpCenter = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <LegalBreadcrumb currentPage="Help Center" />
        <div className="max-w-3xl mb-14">
          <LifeBuoy className="w-10 h-10 text-accent mb-5" />
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">Help Center</h1>
          <p className="text-muted-foreground text-lg">
            Find the right guidance for your account, legal matter, firm application, privacy or consultation.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-16">
          {helpTopics.map((topic) => (
            <section key={topic.title} className="border-t-2 border-accent bg-card p-6 shadow-card">
              <topic.icon className="w-7 h-7 text-accent mb-5" />
              <h2 className="font-serif text-xl font-bold text-foreground mb-4">{topic.title}</h2>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {topic.items.map((item) => <li key={item} className="border-b border-border pb-3 last:border-0">{item}</li>)}
              </ul>
            </section>
          ))}
        </div>

        <section className="grid gap-8 border-y border-border py-10 md:grid-cols-2 md:items-center">
          <div><FileQuestion className="mb-4 h-7 w-7 text-accent" /><h2 className="mb-2 text-2xl font-bold">Start with common questions</h2><p className="text-muted-foreground">Read clear answers about matching, firm verification, consultations, fees and account privacy.</p></div>
          <div className="flex flex-wrap gap-3 md:justify-end"><Button asChild variant="outline"><Link to="/faqs">Read FAQs <ArrowRight /></Link></Button><Button asChild variant="gold"><Link to="/contact">Contact support</Link></Button></div>
        </section>
      </main>
      <BackToTopButton />
      <Footer />
    </div>
  );
};

export default HelpCenter;
