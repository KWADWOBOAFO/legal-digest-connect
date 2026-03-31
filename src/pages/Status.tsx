import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LegalBreadcrumb from "@/components/layout/LegalBreadcrumb";
import BackToTopButton from "@/components/layout/BackToTopButton";
import { CheckCircle } from "lucide-react";

const Status = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <LegalBreadcrumb currentPage="Status" />
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">System Status</h1>
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <p className="text-2xl font-semibold text-foreground mb-2">All Systems Operational</p>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Debriefed is running smoothly. A detailed status page with uptime monitoring is coming soon.
          </p>
        </div>
      </main>
      <BackToTopButton />
      <Footer />
    </div>
  );
};

export default Status;
