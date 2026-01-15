import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Calendar, Download } from 'lucide-react';
import { 
  downloadICSFile, 
  generateGoogleCalendarUrl, 
  generateOutlookCalendarUrl 
} from '@/lib/calendarUtils';
import { useToast } from '@/hooks/use-toast';

interface CalendarExportButtonsProps {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
}

export function CalendarExportButtons({
  title,
  description,
  startDate,
  endDate,
  location
}: CalendarExportButtonsProps) {
  const { toast } = useToast();

  const event = {
    title,
    description,
    startDate,
    endDate,
    location
  };

  const handleGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(event);
    window.open(url, '_blank');
    toast({
      title: 'Google Calendar',
      description: 'Opening Google Calendar to add your consultation'
    });
  };

  const handleOutlookCalendar = () => {
    const url = generateOutlookCalendarUrl(event);
    window.open(url, '_blank');
    toast({
      title: 'Outlook Calendar',
      description: 'Opening Outlook Calendar to add your consultation'
    });
  };

  const handleDownloadICS = () => {
    downloadICSFile(event, `consultation-${startDate.toISOString().split('T')[0]}.ics`);
    toast({
      title: 'Calendar file downloaded',
      description: 'Import the .ics file into your calendar app'
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Calendar className="h-4 w-4" />
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleGoogleCalendar}>
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.5 22h-15A2.5 2.5 0 0 1 2 19.5v-15A2.5 2.5 0 0 1 4.5 2h15A2.5 2.5 0 0 1 22 4.5v15a2.5 2.5 0 0 1-2.5 2.5zM9.5 6.5v11h1.75V13h2.5c1.79 0 3.25-1.46 3.25-3.25S15.54 6.5 13.75 6.5zm2.5 5V8h1.75c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
          </svg>
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOutlookCalendar}>
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.17 2.06A2.5 2.5 0 0 0 19.5 2h-15A2.5 2.5 0 0 0 2 4.5v15A2.5 2.5 0 0 0 4.5 22h15a2.5 2.5 0 0 0 2.5-2.5v-15c0-.66-.26-1.29-.72-1.75-.11-.11-.23-.2-.36-.28zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
          </svg>
          Outlook Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadICS}>
          <Download className="h-4 w-4 mr-2" />
          Download .ics file
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
