import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTopButton from "@/components/layout/BackToTopButton";
import LegalBreadcrumb from "@/components/layout/LegalBreadcrumb";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <LegalBreadcrumb currentPage="Privacy Policy" />
        <h1 className="font-serif text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div className="prose prose-lg max-w-none space-y-8 text-foreground/90">
          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p>Debriefed ("we", "our", "us") is committed to protecting your personal data and respecting your privacy. This Privacy Policy explains how we collect, use, store, and share your personal information when you use our platform.</p>
            <p>We act as a data controller for the personal data we process. If you have any questions about this policy, please contact us using the details provided below.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
            <p>We may collect and process the following categories of personal data:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Identity Data:</strong> Full name, title, date of birth, and profile photograph.</li>
              <li><strong>Contact Data:</strong> Email address, telephone number, and postal address.</li>
              <li><strong>Account Data:</strong> Username, password, and account preferences.</li>
              <li><strong>Case Data:</strong> Details of legal matters you submit, including descriptions, documents, and correspondence.</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, and usage data.</li>
              <li><strong>Communication Data:</strong> Messages exchanged through our platform between clients and law firms.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
            <p>We use your personal data for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>To create and manage your account on our platform.</li>
              <li>To match you with appropriate legal professionals based on your case details.</li>
              <li>To facilitate communication between clients and law firms.</li>
              <li>To schedule and manage consultations.</li>
              <li>To send you important service notifications and updates.</li>
              <li>To improve our platform and develop new features.</li>
              <li>To comply with legal and regulatory obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">4. Legal Basis for Processing</h2>
            <p>We process your personal data on the following legal bases:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Contract:</strong> Processing necessary for the performance of our services.</li>
              <li><strong>Consent:</strong> Where you have given explicit consent for specific processing activities.</li>
              <li><strong>Legitimate Interest:</strong> Processing necessary for our legitimate business interests, such as improving our services.</li>
              <li><strong>Legal Obligation:</strong> Processing necessary to comply with applicable laws.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">5. Data Sharing</h2>
            <p>We may share your personal data with:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Law Firms:</strong> When you submit a case, relevant details are shared with matched law firms to facilitate your legal needs.</li>
              <li><strong>Service Providers:</strong> Third-party providers who assist us in operating our platform (hosting, analytics, payment processing).</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect our rights.</li>
            </ul>
            <p>We will never sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">6. Data Retention</h2>
            <p>We retain your personal data only for as long as necessary to fulfil the purposes for which it was collected, or as required by law. Case data is retained for a minimum of 6 years following the conclusion of a matter, in line with professional regulatory requirements.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">7. Your Rights</h2>
            <p>Under data protection law, you have rights including:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>The right to access your personal data.</li>
              <li>The right to rectification of inaccurate data.</li>
              <li>The right to erasure ("right to be forgotten").</li>
              <li>The right to restrict processing.</li>
              <li>The right to data portability.</li>
              <li>The right to object to processing.</li>
              <li>The right to withdraw consent at any time.</li>
            </ul>
            <p>To exercise any of these rights, please contact us at <a href="mailto:privacy@debriefed.co.uk" className="text-primary hover:underline">privacy@debriefed.co.uk</a>.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">8. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy or our data practices, please contact us at:</p>
            <p className="text-foreground/80">Email: <a href="mailto:privacy@debriefed.co.uk" className="text-primary hover:underline">privacy@debriefed.co.uk</a></p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
