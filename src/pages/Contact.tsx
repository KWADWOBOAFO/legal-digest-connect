import { Link } from "react-router-dom";
import { Clock3, HelpCircle, LockKeyhole, Mail } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LegalBreadcrumb from "@/components/layout/LegalBreadcrumb";
import BackToTopButton from "@/components/layout/BackToTopButton";
import ContactInquiryForm from "@/components/contact/ContactInquiryForm";

const Contact = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-20">
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto max-w-5xl px-4">
          <LegalBreadcrumb currentPage="Contact" />
          <h1 className="mb-5 text-4xl font-bold md:text-6xl">Contact Case Broker</h1>
          <p className="max-w-2xl text-lg leading-relaxed text-primary-foreground/75">Questions about your account, a firm application or the platform? Send the team a message and select the safest channel for legal or privacy enquiries.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="mb-6 text-3xl font-bold">Choose the right contact</h2>
            <div className="divide-y divide-border border-y border-border">
              <div className="flex gap-4 py-5"><Mail className="mt-1 h-5 w-5 shrink-0 text-accent" /><div><h3 className="font-semibold">Platform support</h3><a className="text-sm text-primary hover:underline" href="mailto:support@casebroker.co.uk">support@casebroker.co.uk</a></div></div>
              <div className="flex gap-4 py-5"><LockKeyhole className="mt-1 h-5 w-5 shrink-0 text-accent" /><div><h3 className="font-semibold">Privacy and data rights</h3><a className="text-sm text-primary hover:underline" href="mailto:privacy@casebroker.co.uk">privacy@casebroker.co.uk</a></div></div>
              <div className="flex gap-4 py-5"><HelpCircle className="mt-1 h-5 w-5 shrink-0 text-accent" /><div><h3 className="font-semibold">Legal terms</h3><a className="text-sm text-primary hover:underline" href="mailto:legal@casebroker.co.uk">legal@casebroker.co.uk</a></div></div>
              <div className="flex gap-4 py-5"><Clock3 className="mt-1 h-5 w-5 shrink-0 text-accent" /><div><h3 className="font-semibold">Before contacting us</h3><p className="text-sm text-muted-foreground">The <Link className="text-primary hover:underline" to="/faqs">FAQs</Link> and <Link className="text-primary hover:underline" to="/help">Help Center</Link> answer common platform questions.</p></div></div>
            </div>
            <div className="mt-8 border-l-2 border-accent bg-muted/50 p-5 text-sm leading-relaxed text-muted-foreground">
              Case Broker cannot provide legal advice through this form. If you need a legal professional, create an account and submit your matter instead.
            </div>
          </div>

          <div className="border border-border bg-card p-6 shadow-card md:p-9">
            <h2 className="mb-2 text-3xl font-bold">Send an enquiry</h2>
            <p className="mb-7 text-muted-foreground">Give enough detail for the team to direct your question, but do not include passwords or highly sensitive case documents.</p>
            <ContactInquiryForm />
          </div>
        </div>
      </section>
    </main>
    <BackToTopButton />
    <Footer />
  </div>
);

export default Contact;