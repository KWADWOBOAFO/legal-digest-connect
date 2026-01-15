import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function usePushNotifications() {
  const { user } = useAuth();

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    // Request permission on mount
    requestPermission();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('push-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const message = payload.new as any;
          // Only notify if message is not from current user
          if (message.sender_id !== user.id) {
            showNotification('New Message', {
              body: message.content?.substring(0, 100) || 'You have a new message',
              tag: `message-${message.id}`
            });
          }
        }
      )
      .subscribe();

    // Subscribe to new shared documents
    const documentsChannel = supabase
      .channel('push-documents')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shared_documents'
        },
        (payload) => {
          const doc = payload.new as any;
          // Only notify if document is not from current user
          if (doc.uploaded_by !== user.id) {
            showNotification('New Document Shared', {
              body: `A new document "${doc.file_name}" has been shared with you`,
              tag: `document-${doc.id}`
            });
          }
        }
      )
      .subscribe();

    // Subscribe to notifications table
    const notificationsChannel = supabase
      .channel('push-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const notification = payload.new as any;
          showNotification(notification.title, {
            body: notification.message,
            tag: `notification-${notification.id}`
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(documentsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [user, showNotification, requestPermission]);

  return { requestPermission, showNotification };
}
