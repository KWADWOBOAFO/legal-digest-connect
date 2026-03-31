import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqCategories = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "What is Debriefed?",
        a: "Debriefed is a legal services platform that connects individuals with qualified law firms. Simply describe your legal matter, and our intelligent matching system will pair you with firms that specialise in your area of need.",
      },
      {
        q: "How do I submit a case?",
        a: "After creating a free account, click 'Get Started' and fill in the details of your legal matter. You'll describe your situation, select the urgency level, and optionally upload any relevant documents. Our system will then match you with appropriate law firms.",
      },
      {
        q: "Is it free to use Debriefed?",
        a: "Creating an account and submitting your case is completely free. You only pay when you engage a law firm for their services. Fees are agreed directly between you and the firm before any work begins.",
      },
      {
        q: "How long does the matching process take?",
        a: "Most cases are matched with relevant firms within 24 hours. For urgent matters, matching can happen in as little as a few hours. You'll receive notifications as firms express interest in your case.",
      },
    ],
  },
  {
    category: "For Individuals",
    questions: [
      {
        q: "How are law firms vetted?",
        a: "All law firms on Debriefed are verified against their regulatory body (e.g., SRA in England & Wales). We check their registration status, professional indemnity insurance, and practice areas before they can join the platform.",
      },
      {
        q: "Can I choose which firm to work with?",
        a: "Absolutely. When multiple firms express interest in your case, you can review their profiles, specialisations, ratings, and proposed approach before deciding which firm to engage. You're never obligated to proceed with any firm.",
      },
      {
        q: "What happens during a consultation?",
        a: "Consultations can be conducted via video call, phone, or in-person (depending on the firm). During the consultation, the solicitor will review your case, provide initial advice, and discuss next steps and potential costs.",
      },
      {
        q: "Is my information kept confidential?",
        a: "Yes. All data is encrypted and stored securely. Law firms must sign a Non-Disclosure Agreement before accessing case details. We comply with UK GDPR and data protection regulations. See our Privacy Policy for full details.",
      },
      {
        q: "Can I upload documents to support my case?",
        a: "Yes. You can securely upload documents when submitting your case or at any point during the process. All documents are encrypted and only shared with firms you've approved.",
      },
    ],
  },
  {
    category: "For Law Firms",
    questions: [
      {
        q: "How can my firm join Debriefed?",
        a: "Register on our platform, complete the firm profile with your practice areas and credentials, and submit your regulatory details for verification. Once verified, you'll start receiving relevant case matches.",
      },
      {
        q: "What does it cost for law firms?",
        a: "We offer flexible subscription tiers for law firms. Visit our Pricing page for detailed information on our plans, which are designed to suit firms of all sizes.",
      },
      {
        q: "How does case matching work for firms?",
        a: "Our AI-powered system analyses each case and matches it with firms based on practice area expertise, location, availability, and client preferences. You'll receive notifications for cases that align with your specialisations.",
      },
      {
        q: "Can I manage my team on the platform?",
        a: "Yes. Firm administrators can add legal professionals to their profile, assign cases to specific team members, and manage consultations across the team.",
      },
    ],
  },
  {
    category: "Security & Privacy",
    questions: [
      {
        q: "How is my data protected?",
        a: "We use industry-standard encryption for data in transit and at rest. Our platform is built on secure infrastructure with regular security audits. We never sell your personal data to third parties.",
      },
      {
        q: "Can I delete my account and data?",
        a: "Yes. Under GDPR, you have the right to request deletion of your account and personal data. Contact our support team or use the account settings to initiate this process.",
      },
      {
        q: "Who can see my case details?",
        a: "Only law firms that have been matched with your case and have signed our NDA can view your case details. Your personal information is anonymised in the initial matching phase.",
      },
    ],
  },
  {
    category: "Support",
    questions: [
      {
        q: "How do I contact support?",
        a: "You can reach our support team through the Contact form on our website, or email us directly at support@debriefed.co.uk. We aim to respond within 24 hours.",
      },
      {
        q: "What if I'm not happy with a firm's service?",
        a: "You can leave a review and rating after your consultation. If you have a serious concern, contact our support team and we'll investigate. We take quality assurance seriously and may remove firms that don't meet our standards.",
      },
      {
        q: "Is Debriefed available outside the UK?",
        a: "Currently, Debriefed primarily serves England and Wales. We're actively working on expanding to Scotland, Northern Ireland, and other jurisdictions. Sign up for updates to be notified when we launch in your area.",
      },
    ],
  },
];

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">Frequently Asked Questions</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find answers to common questions about using Debriefed. Can't find what you're looking for? 
            Get in touch with our support team.
          </p>
        </div>

        <div className="space-y-10">
          {faqCategories.map((category) => (
            <section key={category.category}>
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                {category.category}
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {category.questions.map((item, index) => (
                  <AccordionItem key={index} value={`${category.category}-${index}`}>
                    <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
