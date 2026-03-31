import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LegalBreadcrumb from "@/components/layout/LegalBreadcrumb";
import BackToTopButton from "@/components/layout/BackToTopButton";
import { LifeBuoy, Mail, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const HelpCenter = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <LegalBreadcrumb currentPage="Help Center" />
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">Help Center</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Need assistance? We're here to help you get the most out of Debriefed.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <Card>
            <CardContent className="pt-6 text-center">
              <LifeBuoy className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Getting Started</h3>
              <p className="text-sm text-muted-foreground">
                New to Debriefed? Check our FAQs for quick answers to common questions.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Mail className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Email Support</h3>
              <p className="text-sm text-muted-foreground">
                Reach us at support@debriefed.co.uk. We aim to respond within 24 hours.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageCircle className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Live Chat</h3>
              <p className="text-sm text-muted-foreground">
                Coming soon — real-time chat support for urgent enquiries.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-muted-foreground">
          <p>More help resources are on their way. Stay tuned!</p>
        </div>
      </main>
      <BackToTopButton />
      <Footer />
    </div>
  );
};

export default HelpCenter;
