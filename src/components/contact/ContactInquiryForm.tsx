import { useState } from "react";
import { CheckCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ContactInquiryFormProps {
  onSubmitted?: () => void;
}

const ContactInquiryForm = ({ onSubmitted }: ContactInquiryFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("contact_inquiries").insert({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });

      if (error) throw error;
      setIsSubmitted(true);
      setName("");
      setEmail("");
      setMessage("");
      onSubmitted?.();
    } catch {
      toast({
        title: "Message not sent",
        description: "Please try again or email support@casebroker.co.uk.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center text-center" role="status">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <CheckCircle className="h-8 w-8 text-accent" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">Message sent</h2>
        <p className="max-w-sm text-muted-foreground">
          Thank you for contacting Case Broker. We will reply to the email address you provided.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setIsSubmitted(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="contact-name">Full name</Label>
        <Input
          id="contact-name"
          autoComplete="name"
          placeholder="Your full name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-email">Email address</Label>
        <Input
          id="contact-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">How can we help?</Label>
        <Textarea
          id="contact-message"
          placeholder="Include the relevant account or matter details, but do not send passwords or highly sensitive documents."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-36 resize-y"
          required
        />
      </div>
      <Button type="submit" variant="gold" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send message"}
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default ContactInquiryForm;