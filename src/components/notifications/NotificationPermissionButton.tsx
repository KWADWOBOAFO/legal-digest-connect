import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function NotificationPermissionButton() {
  const { requestPermission } = usePushNotifications();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      setPermission('granted');
      toast({
        title: 'Notifications enabled',
        description: 'You will now receive push notifications for new messages and updates.'
      });
    } else {
      setPermission('denied');
      toast({
        title: 'Notifications blocked',
        description: 'You can enable notifications in your browser settings.',
        variant: 'destructive'
      });
    }
  };

  if (!('Notification' in window)) {
    return null;
  }

  if (permission === 'granted') {
    return (
      <Button variant="ghost" size="sm" disabled className="text-green-600">
        <Bell className="h-4 w-4 mr-2" />
        Notifications On
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRequestPermission}>
      {permission === 'denied' ? (
        <>
          <BellOff className="h-4 w-4 mr-2" />
          Enable Notifications
        </>
      ) : (
        <>
          <Bell className="h-4 w-4 mr-2" />
          Enable Notifications
        </>
      )}
    </Button>
  );
}
