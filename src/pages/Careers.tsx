import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LegalBreadcrumb from "@/components/layout/LegalBreadcrumb";
import BackToTopButton from "@/components/layout/BackToTopButton";
import { Briefcase, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const openings = [
  {
    title: "Senior Full-Stack Developer",
    department: "Engineering",
    location: "Remote (UK)",
    type: "Full-time",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "London, UK",
    type: "Full-time",
  },
  {
    title: "Legal Operations Manager",
    department: "Operations",
    location: "Remote (UK)",
    type: "Full-time",
  },
  {
    title: "Customer Success Associate",
    department: "Support",
    location: "Remote (UK)",
    type: "Full-time",
  },
];

const Careers = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <LegalBreadcrumb currentPage="Careers" />

        <h1 className="text-4xl font-serif font-bold text-foreground mb-4">
          Join Our Team
        </h1>
        <p className="text-lg text-muted-foreground mb-12 max-w-2xl">
          Help us bridge the gap between everyday people and excellent legal
          services. We're building the future of access to justice.
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">
            Why Debriefed?
          </h2>
          <p className="text-muted-foreground mb-6">
            We believe everyone deserves access to quality legal support. Our
            mission-driven culture values transparency, innovation, and impact.
            We offer competitive salaries, flexible working, and the chance to
            make a real difference.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif font-semibold text-foreground mb-6">
            Open Positions
          </h2>
          <div className="space-y-4">
            {openings.map((job) => (
              <Card key={job.title} className="hover:shadow-md transition-shadow">
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" /> {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {job.type}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <BackToTopButton />
      <Footer />
    </div>
  );
};

export default Careers;
