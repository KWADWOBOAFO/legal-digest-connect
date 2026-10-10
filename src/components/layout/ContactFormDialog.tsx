import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ContactInquiryForm from "@/components/contact/ContactInquiryForm";

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ContactFormDialog = ({ open, onOpenChange }: ContactFormDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Get in Touch</DialogTitle>
          <DialogDescription>Send us your enquiry and we will reply by email.</DialogDescription>
        </DialogHeader>
        <ContactInquiryForm onSubmitted={() => window.setTimeout(() => onOpenChange(false), 2500)} />
      </DialogContent>
    </Dialog>
  );
};

export default ContactFormDialog;
