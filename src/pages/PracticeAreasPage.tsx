import { Link } from "react-router-dom";
import { ArrowRight, Info, Scale } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LegalBreadcrumb from "@/components/layout/LegalBreadcrumb";
import BackToTopButton from "@/components/layout/BackToTopButton";
import PracticeAreas from "@/components/sections/PracticeAreas";
import { Button } from "@/components/ui/button";

const PracticeAreasPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-20">
      <section className="bg-primary py-16 text-primary-foreground md:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <LegalBreadcrumb currentPage="Practice Areas" />
          <div className="max-w-3xl">
            <Scale className="mb-5 h-10 w-10 text-accent" />
            <h1 className="mb-5 text-4xl font-bold md:text-6xl">Find Expertise for Your Legal Matter</h1>
            <p className="text-lg leading-relaxed text-primary-foreground/75">
              Explore the areas covered by firms using Case Broker. Search in plain English, read what each area commonly includes and submit your matter to begin matching.
            </p>
          </div>
        </div>
      </section>

      <PracticeAreas />

      <section className="border-y border-border bg-background py-16">
        <div className="container mx-auto grid max-w-5xl gap-8 px-4 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10"><Info className="h-6 w-6 text-accent" /></div>
          <div>
            <h2 className="mb-2 text-2xl font-bold">Not sure which area applies?</h2>
            <p className="text-muted-foreground">Describe the situation as you understand it. The matching process can identify overlapping areas and suitable professionals.</p>
          </div>
          <Button asChild variant="outline"><Link to="/auth?mode=signup">Start your matter <ArrowRight /></Link></Button>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-4 text-3xl font-bold">Coverage and jurisdiction</h2>
          <p className="max-w-3xl leading-relaxed text-muted-foreground">
            Case Broker currently focuses on legal services in England and Wales. Firm availability varies by matter, location, urgency and the professional permissions held by each regulated provider. The information on this page is general and is not legal advice.
          </p>
        </div>
      </section>
    </main>
    <BackToTopButton />
    <Footer />
  </div>
);

export default PracticeAreasPage;