import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileText, Pencil, Trash2, ArrowRight, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DRAFT_STORAGE_KEY = "legal-matter-draft";

interface DraftData {
  title: string;
  description: string;
  practiceArea: string;
  savedAt?: string;
}

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

const DraftCard = () => {
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedDraft, setEditedDraft] = useState<DraftData>({
    title: "",
    description: "",
    practiceArea: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadDraft();
  }, []);

  const loadDraft = () => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.title || parsed.description || parsed.practiceArea) {
          setDraft(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved draft");
      }
    }
  };

  const handleEdit = () => {
    if (draft) {
      setEditedDraft(draft);
      setIsEditDialogOpen(true);
    }
  };

  const handleSaveEdit = () => {
    const updatedDraft = {
      ...editedDraft,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updatedDraft));
    setDraft(updatedDraft);
    setIsEditDialogOpen(false);
    toast({
      title: "Draft updated",
      description: "Your changes have been saved.",
    });
  };

  const handleDelete = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setDraft(null);
    toast({
      title: "Draft deleted",
      description: "Your draft has been removed.",
    });
  };

  const handleContinueToSubmission = () => {
    navigate("/submit-case", {
      state: {
        prefill: draft,
      },
    });
  };

  const getPracticeAreaLabel = (value: string) => {
    const area = practiceAreas.find(
      (a) => a.toLowerCase().replace(/\s+/g, "-") === value
    );
    return area || value;
  };

  if (!draft) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground text-sm">No saved drafts</p>
          <p className="text-muted-foreground text-xs mt-1">
            Start a case submission and your progress will be saved automatically
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="animate-fade-in border-accent/20 bg-accent/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-accent/20 rounded-lg">
                <FileText className="h-4 w-4 text-accent" />
              </div>
              <div>
                <CardTitle className="text-base">
                  {draft.title || "Untitled Draft"}
                </CardTitle>
                <CardDescription className="text-xs flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  {draft.savedAt
                    ? `Last edited ${new Date(draft.savedAt).toLocaleDateString()}`
                    : "Auto-saved"}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              Draft
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {draft.practiceArea && (
            <Badge variant="outline" className="text-xs">
              {getPracticeAreaLabel(draft.practiceArea)}
            </Badge>
          )}
          {draft.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {draft.description}
            </p>
          )}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="gold"
              size="sm"
              onClick={handleContinueToSubmission}
              className="flex-1"
            >
              Continue Submission
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Draft</DialogTitle>
            <DialogDescription>
              Make changes to your saved draft before continuing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editedDraft.title}
                onChange={(e) =>
                  setEditedDraft({ ...editedDraft, title: e.target.value })
                }
                placeholder="Brief title for your legal matter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-practice-area">Practice Area</Label>
              <Select
                value={editedDraft.practiceArea}
                onValueChange={(value) =>
                  setEditedDraft({ ...editedDraft, practiceArea: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a practice area" />
                </SelectTrigger>
                <SelectContent>
                  {practiceAreas.map((area) => (
                    <SelectItem
                      key={area}
                      value={area.toLowerCase().replace(/\s+/g, "-")}
                    >
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editedDraft.description}
                onChange={(e) =>
                  setEditedDraft({ ...editedDraft, description: e.target.value })
                }
                placeholder="Describe your legal situation..."
                className="min-h-[120px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DraftCard;
