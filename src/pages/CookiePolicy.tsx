import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTopButton from "@/components/layout/BackToTopButton";
import LegalBreadcrumb from "@/components/layout/LegalBreadcrumb";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <LegalBreadcrumb currentPage="Cookie Policy" />
        <h1 className="font-serif text-4xl font-bold text-foreground mb-8">Cookie Policy</h1>
        <p className="text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div className="prose prose-lg max-w-none space-y-8 text-foreground/90">
          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">1. What Are Cookies?</h2>
            <p>Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the website owners.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">2. How We Use Cookies</h2>
            <p>We use cookies for the following purposes:</p>

            <h3 className="font-semibold text-xl text-foreground mt-6 mb-3">Essential Cookies</h3>
            <p>These cookies are necessary for the Platform to function properly. They enable core functionality such as security, account authentication, and session management. You cannot opt out of these cookies.</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border rounded-lg mt-4">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-3 text-left text-sm font-semibold">Cookie</th>
                    <th className="border border-border px-4 py-3 text-left text-sm font-semibold">Purpose</th>
                    <th className="border border-border px-4 py-3 text-left text-sm font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-4 py-3 text-sm">session_token</td>
                    <td className="border border-border px-4 py-3 text-sm">Maintains your login session</td>
                    <td className="border border-border px-4 py-3 text-sm">Session</td>
                  </tr>
                  <tr className="bg-muted/50">
                    <td className="border border-border px-4 py-3 text-sm">csrf_token</td>
                    <td className="border border-border px-4 py-3 text-sm">Security protection against cross-site attacks</td>
                    <td className="border border-border px-4 py-3 text-sm">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="font-semibold text-xl text-foreground mt-6 mb-3">Functional Cookies</h3>
            <p>These cookies enable enhanced functionality and personalisation, such as remembering your preferences and settings.</p>

            <h3 className="font-semibold text-xl text-foreground mt-6 mb-3">Analytics Cookies</h3>
            <p>These cookies help us understand how visitors interact with our Platform by collecting and reporting information anonymously. This helps us improve our services.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">3. Managing Cookies</h2>
            <p>You can control and manage cookies in several ways:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Browser Settings:</strong> Most browsers allow you to refuse or delete cookies through their settings. Consult your browser's help documentation for instructions.</li>
              <li><strong>Cookie Preferences:</strong> You can update your cookie preferences at any time through our cookie consent banner.</li>
              <li><strong>Opt-Out Links:</strong> Some analytics providers offer opt-out mechanisms directly.</li>
            </ul>
            <p className="mt-4">Please note that disabling certain cookies may affect the functionality of the Platform.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">4. Third-Party Cookies</h2>
            <p>Some cookies are placed by third-party services that appear on our pages. We do not control these cookies. Third parties that may set cookies include analytics providers and authentication services.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">5. Updates to This Policy</h2>
            <p>We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">6. Contact Us</h2>
            <p>If you have any questions about our use of cookies, please contact us at:</p>
            <p className="text-foreground/80">Email: <a href="mailto:privacy@debriefed.co.uk" className="text-primary hover:underline">privacy@debriefed.co.uk</a></p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CookiePolicy;
