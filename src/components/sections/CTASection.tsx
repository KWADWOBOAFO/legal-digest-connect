import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Clock, CheckCircle, Scale } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CTASection = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    practiceArea: "",
  });
  const navigate = useNavigate();

  const practiceAreas = [
    "Family Law",
    "Personal Injury",
    "Criminal Defense",
    "Business Law",
    "Real Estate",
    "Employment Law",
    "Immigration",
    "Estate Planning",
    "Intellectual Property",
    "Other",
  ];

  const handleSubmit = () => {
    // Navigate to the full submit case page with prefilled data
    navigate("/submit-case", { 
      state: { 
        prefill: formData 
      } 
    });
    setIsOpen(false);
  };

  return (
    <>
      <section className="py-24 bg-muted/50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Content */}
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-6">
              Ready to Get Your Legal Matter{" "}
              <span className="text-gradient-gold">Debriefed?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
              Join thousands who've found clarity in their legal situations. 
              Submit your case today and connect with the right legal expert within 24 hours.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button variant="gold" size="lg" onClick={() => setIsOpen(true)}>
                Submit Your Case Free
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg">
                Schedule a Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                <span>256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                <span>24-Hour Response</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-accent" />
                <span>Free Initial Consultation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Submit Case Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Scale className="w-6 h-6 text-accent" />
              </div>
              <DialogTitle className="text-xl font-serif">
                Describe Your Legal Matter
              </DialogTitle>
            </div>
            <DialogDescription>
              Tell us about your situation and we'll connect you with the right legal expert.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Brief Title</Label>
              <Input
                id="title"
                placeholder="e.g., Divorce proceedings, Contract dispute..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="practiceArea">Practice Area</Label>
              <Select
                value={formData.practiceArea}
                onValueChange={(value) => setFormData({ ...formData, practiceArea: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a practice area" />
                </SelectTrigger>
                <SelectContent>
                  {practiceAreas.map((area) => (
                    <SelectItem key={area} value={area.toLowerCase().replace(/\s+/g, "-")}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Describe Your Situation</Label>
              <Textarea
                id="description"
                placeholder="Please provide details about your legal matter. The more information you share, the better we can assist you..."
                className="min-h-[120px] resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="gold" 
              onClick={handleSubmit}
              disabled={!formData.title || !formData.description}
            >
              Continue to Full Submission
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CTASection;
