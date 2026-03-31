import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const GDPR = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <h1 className="font-serif text-4xl font-bold text-foreground mb-8">GDPR Compliance</h1>
        <p className="text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div className="prose prose-lg max-w-none space-y-8 text-foreground/90">
          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">1. Our Commitment to Data Protection</h2>
            <p>Debriefed is fully committed to compliance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018. We take the protection of your personal data seriously and have implemented comprehensive measures to ensure your data is handled lawfully, fairly, and transparently.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">2. Data Controller</h2>
            <p>Debriefed acts as the data controller for personal data collected through our Platform. This means we determine the purposes and means of processing your personal data.</p>
            <div className="p-4 bg-muted rounded-lg border border-border mt-4">
              <p className="font-semibold mb-2">Data Controller Details:</p>
              <p className="text-foreground/80">Debriefed Ltd</p>
              <p className="text-foreground/80">Email: <a href="mailto:dpo@debriefed.co.uk" className="text-primary hover:underline">dpo@debriefed.co.uk</a></p>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">3. Your Rights Under GDPR</h2>
            <p>Under the UK GDPR, you have the following rights regarding your personal data:</p>

            <div className="space-y-4 mt-4">
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Right to Access (Article 15)</h4>
                <p className="text-foreground/80 text-sm">You have the right to request a copy of the personal data we hold about you. We will respond to your request within one month.</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Right to Rectification (Article 16)</h4>
                <p className="text-foreground/80 text-sm">You have the right to request that we correct any inaccurate or incomplete personal data we hold about you.</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Right to Erasure (Article 17)</h4>
                <p className="text-foreground/80 text-sm">You have the right to request that we delete your personal data in certain circumstances, such as when the data is no longer necessary for its original purpose.</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Right to Restrict Processing (Article 18)</h4>
                <p className="text-foreground/80 text-sm">You have the right to request that we limit how we use your personal data in certain circumstances.</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Right to Data Portability (Article 20)</h4>
                <p className="text-foreground/80 text-sm">You have the right to receive your personal data in a structured, commonly used, and machine-readable format.</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Right to Object (Article 21)</h4>
                <p className="text-foreground/80 text-sm">You have the right to object to processing of your personal data based on legitimate interests or for direct marketing purposes.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">4. Lawful Basis for Processing</h2>
            <p>We process personal data under the following lawful bases as defined by GDPR Article 6:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Consent (Art. 6(1)(a)):</strong> Where you have given clear consent for us to process your personal data for a specific purpose.</li>
              <li><strong>Contract (Art. 6(1)(b)):</strong> Where processing is necessary for the performance of a contract with you or to take steps at your request before entering a contract.</li>
              <li><strong>Legal Obligation (Art. 6(1)(c)):</strong> Where processing is necessary to comply with a legal obligation.</li>
              <li><strong>Legitimate Interests (Art. 6(1)(f)):</strong> Where processing is necessary for our legitimate interests, provided these are not overridden by your rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">5. Data Protection Measures</h2>
            <p>We implement appropriate technical and organisational measures to protect your personal data, including:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Encryption of data in transit and at rest.</li>
              <li>Access controls and authentication mechanisms.</li>
              <li>Regular security assessments and audits.</li>
              <li>Staff training on data protection practices.</li>
              <li>Data minimisation — we only collect data that is necessary.</li>
              <li>Regular review and updating of our security measures.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">6. Data Breach Notification</h2>
            <p>In the event of a personal data breach that is likely to result in a risk to your rights and freedoms, we will:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Notify the Information Commissioner's Office (ICO) within 72 hours of becoming aware of the breach.</li>
              <li>Notify affected individuals without undue delay where the breach is likely to result in a high risk to their rights and freedoms.</li>
              <li>Document all breaches, their effects, and the remedial actions taken.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">7. International Data Transfers</h2>
            <p>Where we transfer personal data outside the UK, we ensure appropriate safeguards are in place, such as Standard Contractual Clauses (SCCs) or adequacy decisions, to protect your data in accordance with GDPR requirements.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">8. How to Exercise Your Rights</h2>
            <p>To exercise any of your GDPR rights, you can:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Email our Data Protection Officer at <a href="mailto:dpo@debriefed.co.uk" className="text-primary hover:underline">dpo@debriefed.co.uk</a></li>
              <li>Use the contact form on our Platform.</li>
            </ul>
            <p className="mt-4">We will respond to your request within one month. If your request is complex, we may extend this period by a further two months, and we will inform you of any such extension.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">9. Complaints</h2>
            <p>If you are not satisfied with how we handle your personal data, you have the right to lodge a complaint with the Information Commissioner's Office (ICO):</p>
            <div className="p-4 bg-muted rounded-lg border border-border mt-4">
              <p className="text-foreground/80">Information Commissioner's Office</p>
              <p className="text-foreground/80">Website: <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ico.org.uk</a></p>
              <p className="text-foreground/80">Telephone: 0303 123 1113</p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GDPR;
