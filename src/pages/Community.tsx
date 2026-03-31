import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LegalBreadcrumb from "@/components/layout/LegalBreadcrumb";
import BackToTopButton from "@/components/layout/BackToTopButton";
import { Users } from "lucide-react";

const Community = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <LegalBreadcrumb currentPage="Community" />
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">Community</h1>
          <div className="flex justify-center mb-6">
            <Users className="w-16 h-16 text-primary" />
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Our community space is coming soon. Connect with other users, share experiences, 
            and get advice from legal professionals.
          </p>
          <p className="text-muted-foreground">
            In the meantime, visit our <a href="/faqs" className="text-primary hover:underline">FAQs</a> or 
            contact us at <span className="text-primary">support@debriefed.co.uk</span>.
          </p>
        </div>
      </main>
      <BackToTopButton />
      <Footer />
    </div>
  );
};

export default Community;
