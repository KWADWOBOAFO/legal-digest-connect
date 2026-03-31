import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTopButton from "@/components/layout/BackToTopButton";
import LegalBreadcrumb from "@/components/layout/LegalBreadcrumb";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <LegalBreadcrumb currentPage="Terms of Service" />
        <h1 className="font-serif text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div className="prose prose-lg max-w-none space-y-8 text-foreground/90">
          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">1. About These Terms</h2>
            <p>These Terms of Service ("Terms") govern your use of the Debriefed platform ("Platform"). By accessing or using our Platform, you agree to be bound by these Terms. If you do not agree, please do not use the Platform.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">2. Our Services</h2>
            <p>Debriefed is a legal services marketplace that connects individuals seeking legal assistance with qualified law firms. We provide:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>A platform for submitting legal matters and receiving matched recommendations.</li>
              <li>Communication tools to facilitate discussions between clients and law firms.</li>
              <li>Consultation scheduling and management features.</li>
              <li>Document sharing and management capabilities.</li>
            </ul>
            <p className="mt-4 p-4 bg-muted rounded-lg border border-border"><strong>Important:</strong> Debriefed is not a law firm and does not provide legal advice. We act solely as an intermediary connecting you with independent law firms.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">3. Account Registration</h2>
            <p>To use certain features of the Platform, you must create an account. You agree to:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Provide accurate, current, and complete information during registration.</li>
              <li>Maintain the security of your account credentials.</li>
              <li>Notify us immediately of any unauthorised access to your account.</li>
              <li>Accept responsibility for all activities that occur under your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">4. User Obligations</h2>
            <p>When using the Platform, you agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Submit false, misleading, or fraudulent information.</li>
              <li>Use the Platform for any unlawful purpose.</li>
              <li>Interfere with or disrupt the Platform's functionality.</li>
              <li>Attempt to access other users' accounts or data without authorisation.</li>
              <li>Upload malicious software or harmful content.</li>
              <li>Reproduce, duplicate, or exploit any part of the Platform without our express permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">5. Law Firm Terms</h2>
            <p>Law firms using the Platform additionally agree to:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Maintain valid professional registration and insurance as required by their regulatory body.</li>
              <li>Provide accurate information about their practice areas, qualifications, and fees.</li>
              <li>Respond to client inquiries in a timely and professional manner.</li>
              <li>Comply with all applicable professional conduct rules and regulations.</li>
              <li>Sign and abide by our Non-Disclosure Agreement regarding case information.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">6. Consultations</h2>
            <p>Consultations arranged through the Platform are conducted between the client and the law firm directly. Debriefed is not a party to any legal engagement and accepts no liability for the advice given or services rendered by law firms.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">7. Intellectual Property</h2>
            <p>All content, trademarks, and intellectual property on the Platform belong to Debriefed or its licensors. You may not use, reproduce, or distribute any content from the Platform without our prior written consent.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">8. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, Debriefed shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform. Our total liability shall not exceed the amount you have paid to us in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">9. Termination</h2>
            <p>We may suspend or terminate your access to the Platform at any time if you breach these Terms. You may also close your account at any time by contacting us. Upon termination, your right to use the Platform will cease immediately.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">10. Governing Law</h2>
            <p>These Terms are governed by and construed in accordance with the laws of England and Wales. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">11. Contact Us</h2>
            <p>For questions about these Terms, please contact us at:</p>
            <p className="text-foreground/80">Email: <a href="mailto:legal@debriefed.co.uk" className="text-primary hover:underline">legal@debriefed.co.uk</a></p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
