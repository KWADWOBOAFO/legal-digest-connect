import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, X, ArrowRight } from "lucide-react";

const DRAFT_STORAGE_KEY = "legal-matter-draft";

interface DraftRecoveryBannerProps {
  onContinue: () => void;
}

const DraftRecoveryBanner = ({ onContinue }: DraftRecoveryBannerProps) => {
  const [hasDraft, setHasDraft] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        // Check if draft has meaningful content
        if (parsed.title || parsed.description || parsed.practiceArea) {
          setHasDraft(true);
        }
      } catch (e) {
        console.error("Failed to parse saved draft");
      }
    }
  }, []);

  if (!hasDraft || dismissed) return null;

  return (
    <div className="bg-accent/10 border-b border-accent/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-full">
              <FileText className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                You have an unfinished case submission
              </p>
              <p className="text-xs text-muted-foreground">
                Continue where you left off
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={onContinue}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftRecoveryBanner;
