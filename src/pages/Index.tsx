import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import HowItWorks from "@/components/sections/HowItWorks";
import PracticeAreas from "@/components/sections/PracticeAreas";
import ForFirms from "@/components/sections/ForFirms";
import Testimonials from "@/components/sections/Testimonials";
import CTASection, { CTASectionRef } from "@/components/sections/CTASection";
import Footer from "@/components/layout/Footer";
import DraftRecoveryBanner from "@/components/sections/DraftRecoveryBanner";
import { getDrafts } from "@/lib/draftUtils";

const Index = () => {
  const ctaRef = useRef<CTASectionRef>(null);
  const navigate = useNavigate();

  const handleContinueDraft = () => {
    const drafts = getDrafts();
    if (drafts.length > 1) {
      // Navigate to dashboard drafts tab if multiple drafts
      navigate("/dashboard?tab=drafts");
    } else if (drafts.length === 1) {
      // Continue with first draft in submit form
      navigate("/submit-case", {
        state: {
          prefill: {
            title: drafts[0].title,
            description: drafts[0].description,
            practiceArea: drafts[0].practiceArea,
          },
          draftId: drafts[0].id,
        },
      });
    } else {
      ctaRef.current?.openDialog();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <DraftRecoveryBanner onContinue={handleContinueDraft} />
      <main>
        <HeroSection />
        <HowItWorks />
        <PracticeAreas />
        <ForFirms />
        <Testimonials />
        <CTASection ref={ctaRef} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
