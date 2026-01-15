import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, X, ArrowRight, AlertTriangle } from "lucide-react";
import { getDrafts, isDraftExpiring, migrateOldDraft, Draft } from "@/lib/draftUtils";

interface DraftRecoveryBannerProps {
  onContinue: () => void;
}

const DraftRecoveryBanner = ({ onContinue }: DraftRecoveryBannerProps) => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    migrateOldDraft();
    const allDrafts = getDrafts();
    if (allDrafts.length > 0) {
      setDrafts(allDrafts);
      setTimeout(() => setIsVisible(true), 100);
    }
  }, []);

  if (drafts.length === 0 || dismissed) return null;

  const hasExpiringDrafts = drafts.some((d) => isDraftExpiring(d));
  const draftCount = drafts.length;

  return (
    <div
      className={`overflow-hidden transition-all duration-500 ease-out ${
        hasExpiringDrafts
          ? "bg-destructive/10 border-b border-destructive/20"
          : "bg-accent/10 border-b border-accent/20"
      } ${
        isVisible
          ? "max-h-24 opacity-100 translate-y-0"
          : "max-h-0 opacity-0 -translate-y-4"
      }`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap animate-fade-in">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                hasExpiringDrafts
                  ? "bg-destructive/20 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"
                  : "bg-accent/20 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"
              }`}
            >
              {hasExpiringDrafts ? (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              ) : (
                <FileText className="w-4 h-4 text-accent" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {draftCount === 1
                  ? "You have an unfinished case submission"
                  : `You have ${draftCount} unfinished case submissions`}
              </p>
              <p className="text-xs text-muted-foreground">
                {hasExpiringDrafts
                  ? "Some drafts are expiring soon - complete them to preserve your work"
                  : "Continue where you left off"}
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
              variant={hasExpiringDrafts ? "destructive" : "gold"}
              size="sm"
              onClick={onContinue}
              className="hover-scale"
            >
              {draftCount === 1 ? "Continue" : "View Drafts"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftRecoveryBanner;
