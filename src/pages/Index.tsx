import { useRef } from "react";
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import HowItWorks from "@/components/sections/HowItWorks";
import PracticeAreas from "@/components/sections/PracticeAreas";
import ForFirms from "@/components/sections/ForFirms";
import Testimonials from "@/components/sections/Testimonials";
import CTASection, { CTASectionRef } from "@/components/sections/CTASection";
import Footer from "@/components/layout/Footer";
import DraftRecoveryBanner from "@/components/sections/DraftRecoveryBanner";

const Index = () => {
  const ctaRef = useRef<CTASectionRef>(null);

  const handleContinueDraft = () => {
    ctaRef.current?.openDialog();
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
