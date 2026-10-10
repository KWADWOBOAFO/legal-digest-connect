import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

export const SITE_URL = "https://casebroker.co.uk";

const DEFAULT = {
  title: "Case Broker | Get Matched with Specialist Law Firms",
  description:
    "Submit your legal matter and get matched with specialist UK law firms for a video consultation. Compare fees, reviews and awards.",
};

const META: Record<string, { title: string; description: string }> = {
  "/": DEFAULT,
  "/firms": {
    title: "Browse Verified Law Firms | Case Broker",
    description: "Explore regulator-verified law firms and solicitors by practice area, compare fees, reviews and awards.",
  },
  "/pricing": {
    title: "Pricing for Law Firms | Case Broker",
    description: "Plans for law firms and solicitors to receive matched legal matters and grow their client base.",
  },
  "/how-it-works": {
    title: "How Case Broker Works | Legal Firm Matching",
    description: "See how to submit a legal matter, compare interested regulated firms and book a secure video consultation through Case Broker.",
  },
  "/practice-areas": {
    title: "Legal Practice Areas | Case Broker",
    description: "Explore 22 legal practice areas and find regulated professionals for matters in England and Wales.",
  },
  "/for-law-firms": {
    title: "Case Broker for Law Firms & Legal Professionals",
    description: "Learn how regulated firms join Case Broker, receive matched matters and conduct paid video consultations.",
  },
  "/contact": {
    title: "Contact Case Broker | Platform Support",
    description: "Contact Case Broker about account support, firm applications, privacy requests and platform enquiries.",
  },
  "/about": {
    title: "About Case Broker | Access to Justice",
    description: "Case Broker connects everyday people with excellent, verified legal professionals across the UK.",
  },
  "/faqs": {
    title: "Frequently Asked Questions | Case Broker",
    description: "Answers to common questions about submitting a legal matter, firm matching, consultations and fees.",
  },
  "/help": {
    title: "Help Center | Case Broker",
    description: "Guides and support for clients and law firms using the Case Broker platform.",
  },
  "/community": {
    title: "Community | Case Broker",
    description: "Join the Case Broker community of clients and legal professionals improving access to justice.",
  },
  "/status": {
    title: "Platform Status | Case Broker",
    description: "Live operational status of the Case Broker platform and its services.",
  },
  "/careers": {
    title: "Careers at Case Broker",
    description: "Help us make legal services accessible. View open roles at Case Broker.",
  },
  "/blog": {
    title: "Blog & Legal Insights | Case Broker",
    description: "Guides, insights and updates on legal matters, choosing a solicitor and access to justice.",
  },
  "/privacy": {
    title: "Privacy Policy | Case Broker",
    description: "How Case Broker collects, uses and protects your personal data.",
  },
  "/terms": {
    title: "Terms of Service | Case Broker",
    description: "The terms that govern use of the Case Broker legal matching platform.",
  },
  "/cookies": {
    title: "Cookie Policy | Case Broker",
    description: "Information about the cookies Case Broker uses and how to manage them.",
  },
  "/gdpr": {
    title: "GDPR Compliance | Case Broker",
    description: "Your rights under UK GDPR and how Case Broker keeps your legal data secure.",
  },
  "/auth": {
    title: "Sign In or Create an Account | Case Broker",
    description: "Sign in or sign up as an individual or law firm to start using Case Broker.",
  },
};

const RouteSeo = () => {
  const { pathname } = useLocation();
  const meta = META[pathname] ?? DEFAULT;
  const url = `${SITE_URL}${pathname === "/" ? "/" : pathname}`;
  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
    </Helmet>
  );
};

export default RouteSeo;
