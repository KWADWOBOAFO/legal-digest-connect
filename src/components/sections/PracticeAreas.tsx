import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Scale, Briefcase, Users, Home, FileText, Shield, 
  Globe, Gavel, Building2, Anchor, ScrollText, Leaf,
  Trophy, Film, Landmark, Cpu, HardHat, Heart, Flag, 
  Settings, X
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const practiceAreas = [
  { 
    name: "Criminal Law", icon: Gavel, color: "from-red-500/20 to-red-500/5",
    summary: "Defence & prosecution in criminal matters",
    description: "Covers offences against the state, from minor infractions to serious crimes. Includes police investigations, bail applications, trials, sentencing, and appeals. Whether you're facing charges or need advice on your rights, criminal lawyers guide you through every stage of the justice system."
  },
  { 
    name: "Contract Law", icon: FileText, color: "from-blue-500/20 to-blue-500/5",
    summary: "Drafting, reviewing & enforcing agreements",
    description: "Governs legally binding agreements between parties. Covers contract drafting, negotiation, breach of contract claims, and dispute resolution. Essential for business deals, service agreements, employment contracts, and any situation where parties need enforceable commitments."
  },
  { 
    name: "Family Law", icon: Users, color: "from-pink-500/20 to-pink-500/5",
    summary: "Divorce, custody & family disputes",
    description: "Handles legal matters within family relationships including divorce and separation, child custody and access arrangements, financial settlements, prenuptial agreements, adoption, and domestic violence protection orders."
  },
  { 
    name: "Property Law", icon: Home, color: "from-green-500/20 to-green-500/5",
    summary: "Buying, selling & managing property",
    description: "Covers all aspects of real estate and land ownership. Includes conveyancing (buying/selling property), landlord-tenant disputes, lease agreements, boundary disputes, property development, and planning permissions."
  },
  { 
    name: "Tax Law", icon: Landmark, color: "from-amber-500/20 to-amber-500/5",
    summary: "Tax planning, compliance & disputes",
    description: "Deals with tax obligations, planning, and disputes with revenue authorities. Covers income tax, corporation tax, VAT, capital gains, inheritance tax, and international tax matters. Helps individuals and businesses stay compliant while minimising tax liability."
  },
  { 
    name: "Cyber Crime", icon: Shield, color: "from-purple-500/20 to-purple-500/5",
    summary: "Online fraud, hacking & digital offences",
    description: "Addresses criminal activity conducted through digital means. Covers hacking, online fraud, identity theft, data breaches, cyberstalking, and offences under the Computer Misuse Act. Also includes digital evidence handling and defending against cyber-related charges."
  },
  { 
    name: "Tort Law", icon: Scale, color: "from-orange-500/20 to-orange-500/5",
    summary: "Civil wrongs & compensation claims",
    description: "Covers civil wrongs that cause harm or loss to another party. Includes negligence claims, defamation (libel and slander), nuisance, trespass, and product liability. Aims to provide compensation to victims for injuries or damages caused by others."
  },
  { 
    name: "IP Law", icon: Cpu, color: "from-cyan-500/20 to-cyan-500/5",
    summary: "Patents, trademarks & creative rights",
    description: "Protects creations of the mind — inventions, literary works, designs, and brand identities. Covers patents, trademarks, copyright, trade secrets, and licensing agreements. Essential for innovators, artists, and businesses safeguarding their competitive advantage."
  },
  { 
    name: "Immigration", icon: Globe, color: "from-teal-500/20 to-teal-500/5",
    summary: "Visas, asylum & residency matters",
    description: "Handles all aspects of moving to, staying in, or being removed from a country. Covers visa applications, work permits, asylum claims, deportation defence, citizenship applications, family reunification, and appeals against Home Office decisions."
  },
  { 
    name: "Employment", icon: Briefcase, color: "from-indigo-500/20 to-indigo-500/5",
    summary: "Workplace rights, disputes & tribunals",
    description: "Governs the relationship between employers and employees. Covers unfair dismissal, discrimination, redundancy, employment contracts, workplace harassment, whistleblowing protections, and tribunal claims. Protects rights on both sides of the employment relationship."
  },
  { 
    name: "Commercial", icon: Building2, color: "from-slate-500/20 to-slate-500/5",
    summary: "Business transactions & trade agreements",
    description: "Covers the legal aspects of business operations and commercial transactions. Includes sale of goods, supply of services, agency agreements, distribution deals, franchise arrangements, and commercial dispute resolution."
  },
  { 
    name: "Company Law", icon: Building2, color: "from-blue-600/20 to-blue-600/5",
    summary: "Company formation, governance & compliance",
    description: "Deals with the formation, running, and regulation of companies. Covers incorporation, directors' duties, shareholder agreements, company restructuring, mergers and acquisitions, and insolvency. Essential for anyone starting or managing a business."
  },
  { 
    name: "Maritime Law", icon: Anchor, color: "from-sky-500/20 to-sky-500/5",
    summary: "Shipping, cargo & maritime disputes",
    description: "Governs activities and disputes on navigable waters. Covers shipping contracts, cargo claims, vessel collisions, maritime insurance, salvage rights, crew employment, and port regulations. Vital for shipping companies, importers, and marine businesses."
  },
  { 
    name: "Wills & Probate", icon: ScrollText, color: "from-stone-500/20 to-stone-500/5",
    summary: "Estate planning & inheritance matters",
    description: "Handles the planning and distribution of a person's estate. Covers will drafting, powers of attorney, probate applications, estate administration, inheritance disputes, and trust creation. Ensures your wishes are carried out and your loved ones are provided for."
  },
  { 
    name: "Environmental", icon: Leaf, color: "from-emerald-500/20 to-emerald-500/5",
    summary: "Pollution, regulations & sustainability",
    description: "Covers laws protecting the natural environment. Includes pollution control, waste management regulations, environmental impact assessments, climate change legislation, conservation, and compliance with environmental standards for businesses and developments."
  },
  { 
    name: "Sports Law", icon: Trophy, color: "from-yellow-500/20 to-yellow-500/5",
    summary: "Athlete contracts, disputes & governance",
    description: "Addresses legal issues in the sports industry. Covers athlete contracts and transfers, doping regulations, sponsorship agreements, broadcasting rights, sports governance disputes, disciplinary proceedings, and safeguarding in sport."
  },
  { 
    name: "Media & Entertainment", icon: Film, color: "from-rose-500/20 to-rose-500/5",
    summary: "Publishing, broadcasting & content rights",
    description: "Covers legal matters in media, publishing, film, music, and digital content. Includes content licensing, broadcasting regulations, defamation, privacy rights, talent contracts, production agreements, and digital content distribution."
  },
  { 
    name: "Banking & Finance", icon: Landmark, color: "from-violet-500/20 to-violet-500/5",
    summary: "Financial regulation & lending disputes",
    description: "Governs financial institutions and transactions. Covers lending agreements, financial regulation compliance, securities law, fund formation, banking disputes, debt restructuring, and consumer credit issues. Essential for banks, fintech companies, and borrowers."
  },
  { 
    name: "Construction", icon: HardHat, color: "from-orange-600/20 to-orange-600/5",
    summary: "Building contracts, defects & disputes",
    description: "Covers legal issues in the construction industry. Includes building contracts, payment disputes, defective work claims, health and safety compliance, adjudication, professional negligence against architects or engineers, and planning law."
  },
  { 
    name: "Personal Injury", icon: Heart, color: "from-red-400/20 to-red-400/5",
    summary: "Accident claims & injury compensation",
    description: "Helps individuals who have been physically or psychologically injured due to someone else's negligence. Covers road traffic accidents, workplace injuries, medical negligence, slip and fall claims, and industrial disease. Typically handled on a no-win, no-fee basis."
  },
  { 
    name: "Human Rights", icon: Flag, color: "from-blue-400/20 to-blue-400/5",
    summary: "Civil liberties & fundamental freedoms",
    description: "Protects fundamental rights and freedoms under the Human Rights Act and international conventions. Covers right to privacy, freedom of expression, right to a fair trial, protection from discrimination, and challenges against public authority decisions that infringe on individual rights."
  },
  { 
    name: "ADR", icon: Settings, color: "from-gray-500/20 to-gray-500/5",
    summary: "Mediation, arbitration & negotiation",
    description: "Alternative Dispute Resolution offers ways to resolve conflicts without going to court. Includes mediation (neutral third-party facilitation), arbitration (binding private adjudication), negotiation, and conciliation. Often faster, cheaper, and more flexible than litigation."
  },
];

const PracticeAreas = () => {
  const navigate = useNavigate();
  const [selectedArea, setSelectedArea] = useState<typeof practiceAreas[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return practiceAreas;
    const q = searchQuery.toLowerCase();
    return practiceAreas.filter(
      (area) =>
        area.name.toLowerCase().includes(q) ||
        area.summary.toLowerCase().includes(q) ||
        area.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <section id="practice-areas" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-accent font-semibold text-sm tracking-wider uppercase mb-4">
            Comprehensive Coverage
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
            22 Practice Areas Covered
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            No matter your legal challenge, we'll identify the right area of law 
            and connect you with specialists who can help. Hover or tap any area to learn more.
          </p>

          {/* Search Input */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search practice areas... e.g. divorce, contract, injury"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 transition-all"
            />
          </div>
        </div>

        {/* Practice Areas Grid */}
        <TooltipProvider delayDuration={200}>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredAreas.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <p className="text-lg">No practice areas match "{searchQuery}"</p>
                <p className="text-sm mt-1">Try a different search term or browse all areas above.</p>
              </div>
            )}
            {filteredAreas.map((area, index) => (
              <Tooltip key={area.name}>
                <TooltipTrigger asChild>
                  <div
                    className="group relative bg-card rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border hover:border-accent/30 cursor-pointer overflow-hidden"
                    style={{ animationDelay: `${index * 30}ms` }}
                    onClick={() => setSelectedArea(area)}
                  >
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${area.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-3 group-hover:bg-accent/10 transition-colors">
                        <area.icon className="w-6 h-6 text-muted-foreground group-hover:text-accent transition-colors" />
                      </div>
                      <span className="text-sm font-medium text-foreground leading-tight">
                        {area.name}
                      </span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent 
                  side="bottom" 
                  className="max-w-[240px] text-center bg-popover text-popover-foreground border-border shadow-lg"
                >
                  <p className="font-medium text-sm">{area.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{area.summary}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>

      {/* Detail Dialog on Click */}
      <Dialog open={!!selectedArea} onOpenChange={(open) => !open && setSelectedArea(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              {selectedArea && (
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${selectedArea.color} flex items-center justify-center`}>
                  {selectedArea && <selectedArea.icon className="w-6 h-6 text-accent" />}
                </div>
              )}
              <div>
                <DialogTitle className="text-xl">{selectedArea?.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">{selectedArea?.summary}</p>
              </div>
            </div>
          </DialogHeader>
          <DialogDescription className="text-sm text-foreground/80 leading-relaxed">
            {selectedArea?.description}
          </DialogDescription>
          <Button
            variant="gold"
            className="w-full mt-4"
            onClick={() => {
              setSelectedArea(null);
              navigate('/submit-case', {
                state: { prefill: { practiceArea: selectedArea?.name } }
              });
            }}
          >
            Submit a Case in {selectedArea?.name}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default PracticeAreas;
