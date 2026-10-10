import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LegalBreadcrumb from "@/components/layout/LegalBreadcrumb";
import BackToTopButton from "@/components/layout/BackToTopButton";
import { Link } from "react-router-dom";
import { BellRing, CircleHelp, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const services = ["Account access and authentication", "Case submission and matching", "Secure documents and messaging", "Video consultations", "Email notifications"];

const Status = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <LegalBreadcrumb currentPage="Status" />
        <div className="max-w-3xl mb-14">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">System Status</h1>
          <p className="text-muted-foreground text-lg">
            Service notices and practical guidance if you are having trouble accessing Case Broker.
          </p>
        </div>

        <section className="mb-14 border-l-2 border-accent bg-muted/50 p-6">
          <div className="flex gap-4"><CircleHelp className="mt-1 h-6 w-6 shrink-0 text-accent" /><div><h2 className="mb-2 text-xl font-bold">Live uptime reporting is not currently published</h2><p className="leading-relaxed text-muted-foreground">This page does not make an automated operational claim. If a service is unavailable, report what you were doing, the time and any error shown so the support team can investigate.</p></div></div>
        </section>

        <section className="mb-14">
          <h2 className="mb-6 text-2xl font-bold">Services covered</h2>
          <div className="divide-y divide-border border-y border-border">{services.map((service) => <div key={service} className="flex items-center gap-3 py-4"><ShieldCheck className="h-5 w-5 text-accent" /><span>{service}</span></div>)}</div>
        </section>

        <section className="grid gap-8 bg-primary p-7 text-primary-foreground md:grid-cols-[1fr_auto] md:items-center">
          <div><BellRing className="mb-4 h-7 w-7 text-accent" /><h2 className="mb-2 text-2xl font-bold">Report a service problem</h2><p className="text-primary-foreground/70">Contact support from the email address linked to your account. Do not send passwords or confidential case documents.</p></div>
          <Button asChild variant="gold"><Link to="/contact"><Mail /> Contact support</Link></Button>
        </section>
      </main>
      <BackToTopButton />
      <Footer />
    </div>
  );
};

export default Status;
