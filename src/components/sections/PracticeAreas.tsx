import { 
  Scale, Briefcase, Users, Home, FileText, Shield, 
  Globe, Gavel, Building2, Anchor, ScrollText, Leaf,
  Trophy, Film, Landmark, Cpu, HardHat, Heart, Flag, 
  Settings
} from "lucide-react";

const practiceAreas = [
  { name: "Criminal Law", icon: Gavel, color: "from-red-500/20 to-red-500/5" },
  { name: "Contract Law", icon: FileText, color: "from-blue-500/20 to-blue-500/5" },
  { name: "Family Law", icon: Users, color: "from-pink-500/20 to-pink-500/5" },
  { name: "Property Law", icon: Home, color: "from-green-500/20 to-green-500/5" },
  { name: "Tax Law", icon: Landmark, color: "from-amber-500/20 to-amber-500/5" },
  { name: "Cyber Crime", icon: Shield, color: "from-purple-500/20 to-purple-500/5" },
  { name: "Tort Law", icon: Scale, color: "from-orange-500/20 to-orange-500/5" },
  { name: "IP Law", icon: Cpu, color: "from-cyan-500/20 to-cyan-500/5" },
  { name: "Immigration", icon: Globe, color: "from-teal-500/20 to-teal-500/5" },
  { name: "Employment", icon: Briefcase, color: "from-indigo-500/20 to-indigo-500/5" },
  { name: "Commercial", icon: Building2, color: "from-slate-500/20 to-slate-500/5" },
  { name: "Company Law", icon: Building2, color: "from-blue-600/20 to-blue-600/5" },
  { name: "Maritime Law", icon: Anchor, color: "from-sky-500/20 to-sky-500/5" },
  { name: "Wills & Probate", icon: ScrollText, color: "from-stone-500/20 to-stone-500/5" },
  { name: "Environmental", icon: Leaf, color: "from-emerald-500/20 to-emerald-500/5" },
  { name: "Sports Law", icon: Trophy, color: "from-yellow-500/20 to-yellow-500/5" },
  { name: "Media & Entertainment", icon: Film, color: "from-rose-500/20 to-rose-500/5" },
  { name: "Banking & Finance", icon: Landmark, color: "from-violet-500/20 to-violet-500/5" },
  { name: "Construction", icon: HardHat, color: "from-orange-600/20 to-orange-600/5" },
  { name: "Personal Injury", icon: Heart, color: "from-red-400/20 to-red-400/5" },
  { name: "Human Rights", icon: Flag, color: "from-blue-400/20 to-blue-400/5" },
  { name: "ADR", icon: Settings, color: "from-gray-500/20 to-gray-500/5" },
];

const PracticeAreas = () => {
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
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            No matter your legal challenge, we'll identify the right area of law 
            and connect you with specialists who can help.
          </p>
        </div>

        {/* Practice Areas Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {practiceAreas.map((area, index) => (
            <div
              key={area.name}
              className={`group relative bg-card rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border hover:border-accent/30 cursor-pointer overflow-hidden`}
              style={{ animationDelay: `${index * 30}ms` }}
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default PracticeAreas;
