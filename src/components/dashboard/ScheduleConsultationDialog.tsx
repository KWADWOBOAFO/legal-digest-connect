import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CalendarExportButtons } from "@/components/calendar/CalendarExportButtons";

interface ScheduleConsultationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firmName: string;
  caseName: string;
  onSchedule: (data: {
    date: Date;
    time: string;
    duration: number;
    notes: string;
    consultationType: string;
  }) => void;
  isLoading?: boolean;
}

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00"
];

const durations = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
];

export function ScheduleConsultationDialog({
  open,
  onOpenChange,
  firmName,
  caseName,
  onSchedule,
  isLoading
}: ScheduleConsultationDialogProps) {
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>("");
  const [duration, setDuration] = useState<number>(30);
  const [notes, setNotes] = useState("");
  const [consultationType, setConsultationType] = useState("video");
  const [isScheduled, setIsScheduled] = useState(false);

  const handleSubmit = () => {
    if (!date || !time) return;
    onSchedule({ date, time, duration, notes, consultationType });
    setIsScheduled(true);
  };

  const getScheduledDateTime = () => {
    if (!date || !time) return null;
    const [hours, minutes] = time.split(':').map(Number);
    const startDate = new Date(date);
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + duration);
    return { startDate, endDate };
  };

  const isValid = date && time;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Consultation</DialogTitle>
          <DialogDescription>
            Book a consultation with <strong>{firmName}</strong> for your case: <strong>{caseName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time">
                    {time && (
                      <span className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        {time}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((d) => (
                    <SelectItem key={d.value} value={d.value.toString()}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Consultation Type</Label>
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <span className="font-medium">Video Call</span>
              <span className="text-muted-foreground">— all consultations are conducted securely via video</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Any specific topics you'd like to discuss..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isScheduled && date && time && (() => {
            const times = getScheduledDateTime();
            if (!times) return null;
            return (
              <CalendarExportButtons
                title={`Legal Consultation - ${caseName}`}
                description={`Consultation with ${firmName} regarding ${caseName}. ${notes ? `Notes: ${notes}` : ''}`}
                startDate={times.startDate}
                endDate={times.endDate}
                location="Video Call"
              />
            );
          })()}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {isScheduled ? 'Close' : 'Cancel'}
            </Button>
            {!isScheduled && (
              <Button onClick={handleSubmit} disabled={!isValid || isLoading}>
                {isLoading ? "Scheduling..." : "Schedule Consultation"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
