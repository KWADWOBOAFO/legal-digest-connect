import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Scale, Target, Heart, Users, Shield, Award } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Access for All",
    description: "We believe everyone deserves access to quality legal representation, regardless of their background or budget.",
  },
  {
    icon: Shield,
    title: "Trust & Transparency",
    description: "Every firm on our platform is verified. We maintain the highest standards of data protection and confidentiality.",
  },
  {
    icon: Heart,
    title: "People First",
    description: "Legal matters are deeply personal. We treat every case with the empathy and care it deserves.",
  },
  {
    icon: Award,
    title: "Quality Assured",
    description: "We only partner with regulated, reputable law firms who share our commitment to excellence.",
  },
];

const team = [
  {
    name: "Alexandra Chen",
    role: "Founder & CEO",
    bio: "Former barrister with 15 years' experience in access to justice initiatives. Alexandra founded Debriefed to bridge the gap between people and legal services.",
  },
  {
    name: "James Okafor",
    role: "Chief Technology Officer",
    bio: "Previously led engineering at a leading legal tech company. James brings deep expertise in building secure, scalable platforms.",
  },
  {
    name: "Sarah Mitchell",
    role: "Head of Legal Partnerships",
    bio: "Solicitor turned legal tech advocate. Sarah oversees our relationships with law firms and ensures quality standards across the platform.",
  },
  {
    name: "David Park",
    role: "Head of Product",
    bio: "UX specialist passionate about making complex processes simple. David ensures Debriefed is intuitive for everyone.",
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-primary text-primary-foreground py-20">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Scale className="w-8 h-8 text-accent-foreground" />
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">About Debriefed</h1>
            <p className="text-primary-foreground/70 text-lg md:text-xl max-w-2xl mx-auto">
              We're on a mission to make quality legal services accessible to everyone. 
              By connecting people with the right law firms, we're transforming how legal help is found and delivered.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground mb-6">Our Mission</h2>
                <p className="text-muted-foreground mb-4">
                  The legal system can feel overwhelming and inaccessible. Finding the right solicitor for your specific situation 
                  shouldn't require hours of research, cold calls, and uncertainty.
                </p>
                <p className="text-muted-foreground mb-4">
                  Debriefed was born from a simple idea: what if finding legal help was as straightforward as describing your problem 
                  and being matched with the right expert? We use intelligent matching to connect your legal matter with firms that 
                  specialise in exactly what you need.
                </p>
                <p className="text-muted-foreground">
                  Since our founding, we've helped thousands of individuals find qualified legal representation, 
                  and we're just getting started.
                </p>
              </div>
              <div className="bg-muted rounded-2xl p-8 border border-border">
                <div className="space-y-6">
                  <div>
                    <p className="text-4xl font-bold text-primary mb-1">5,000+</p>
                    <p className="text-muted-foreground text-sm">Cases successfully matched</p>
                  </div>
                  <div className="border-t border-border pt-6">
                    <p className="text-4xl font-bold text-primary mb-1">200+</p>
                    <p className="text-muted-foreground text-sm">Verified law firms</p>
                  </div>
                  <div className="border-t border-border pt-6">
                    <p className="text-4xl font-bold text-primary mb-1">98%</p>
                    <p className="text-muted-foreground text-sm">Client satisfaction rate</p>
                  </div>
                  <div className="border-t border-border pt-6">
                    <p className="text-4xl font-bold text-primary mb-1">24hrs</p>
                    <p className="text-muted-foreground text-sm">Average time to first consultation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="font-serif text-3xl font-bold text-foreground text-center mb-12">Our Values</h2>
            <div className="grid sm:grid-cols-2 gap-8">
              {values.map((value) => (
                <div key={value.title} className="bg-background rounded-xl p-6 border border-border">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="font-serif text-3xl font-bold text-foreground text-center mb-4">Our Team</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              A passionate team of legal professionals, technologists, and designers working together to improve access to justice.
            </p>
            <div className="grid sm:grid-cols-2 gap-8">
              {team.map((member) => (
                <div key={member.name} className="text-center p-6">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">{member.name}</h3>
                  <p className="text-primary text-sm font-medium mb-3">{member.role}</p>
                  <p className="text-muted-foreground text-sm">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
