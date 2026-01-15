import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Clock, CheckCircle, Scale, AlertCircle } from "lucide-react";
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
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const DRAFT_STORAGE_KEY = "legal-matter-draft";

const formSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(20, "Please provide more details (at least 20 characters)")
    .max(2000, "Description must be less than 2000 characters"),
  practiceArea: z.string().min(1, "Please select a practice area"),
});

type FormData = z.infer<typeof formSchema>;
type FormErrors = Partial<Record<keyof FormData, string>>;

export interface CTASectionRef {
  openDialog: () => void;
}

const CTASection = forwardRef<CTASectionRef>((_, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    practiceArea: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useImperativeHandle(ref, () => ({
    openDialog: () => setIsOpen(true),
  }));

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

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.title || parsed.description || parsed.practiceArea) {
          setFormData(parsed);
          toast({
            title: "Draft restored",
            description: "Your previous case submission has been recovered.",
          });
        }
      } catch (e) {
        console.error("Failed to parse saved draft");
      }
    }
  }, [toast]);

  // Save draft to localStorage when form changes
  useEffect(() => {
    if (formData.title || formData.description || formData.practiceArea) {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData]);

  const validateField = (field: keyof FormData, value: string): string | undefined => {
    try {
      formSchema.shape[field].parse(value);
      return undefined;
    } catch (err) {
      if (err instanceof z.ZodError) {
        return err.errors[0]?.message;
      }
      return "Invalid input";
    }
  };

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors({ ...errors, [field]: error });
    }
  };

  const handleFieldBlur = (field: keyof FormData) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, formData[field]);
    setErrors({ ...errors, [field]: error });
  };

  const validateForm = (): boolean => {
    const result = formSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormData;
        newErrors[field] = err.message;
      });
      setErrors(newErrors);
      setTouched({ title: true, description: true, practiceArea: true });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    // Clear draft on successful submission
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    
    navigate("/submit-case", { 
      state: { 
        prefill: formData 
      } 
    });
    setIsOpen(false);
  };

  const handleClearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setFormData({ title: "", description: "", practiceArea: "" });
    setErrors({});
    setTouched({});
  };

  const hasDraft = formData.title || formData.description || formData.practiceArea;

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
              {hasDraft && (
                <span className="block mt-1 text-accent">
                  ✓ Draft saved automatically
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center justify-between">
                Brief Title
                <span className="text-xs text-muted-foreground">
                  {formData.title.length}/100
                </span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Divorce proceedings, Contract dispute..."
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                onBlur={() => handleFieldBlur("title")}
                className={errors.title && touched.title ? "border-destructive" : ""}
                maxLength={100}
              />
              {errors.title && touched.title && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.title}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="practiceArea">Practice Area</Label>
              <Select
                value={formData.practiceArea}
                onValueChange={(value) => {
                  handleFieldChange("practiceArea", value);
                  setTouched({ ...touched, practiceArea: true });
                }}
              >
                <SelectTrigger 
                  className={errors.practiceArea && touched.practiceArea ? "border-destructive" : ""}
                >
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
              {errors.practiceArea && touched.practiceArea && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.practiceArea}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center justify-between">
                Describe Your Situation
                <span className="text-xs text-muted-foreground">
                  {formData.description.length}/2000
                </span>
              </Label>
              <Textarea
                id="description"
                placeholder="Please provide details about your legal matter. The more information you share, the better we can assist you..."
                className={`min-h-[120px] resize-none ${errors.description && touched.description ? "border-destructive" : ""}`}
                value={formData.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                onBlur={() => handleFieldBlur("description")}
                maxLength={2000}
              />
              {errors.description && touched.description && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.description}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 w-full sm:w-auto">
              {hasDraft && (
                <Button variant="ghost" size="sm" onClick={handleClearDraft} className="text-muted-foreground">
                  Clear Draft
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
            <Button 
              variant="gold" 
              onClick={handleSubmit}
            >
              Continue to Full Submission
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

CTASection.displayName = "CTASection";

export default CTASection;
