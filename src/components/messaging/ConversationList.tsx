import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface Conversation {
  id: string;
  case_id: string | null;
  client_id: string;
  firm_id: string;
  created_at: string;
  updated_at: string;
  firm_name?: string;
  client_name?: string;
  case_title?: string;
  last_message?: string;
  unread_count?: number;
}

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedId?: string;
}

export function ConversationList({ onSelectConversation, selectedId }: ConversationListProps) {
  const { user, profile, lawFirm } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isClient = profile?.user_type === 'individual';

  useEffect(() => {
    fetchConversations();
  }, [user, lawFirm]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Enrich conversations with names and last messages
      const enrichedConversations = await Promise.all(
        (data || []).map(async (conv) => {
          // Get firm name
          const { data: firmData } = await supabase
            .from('law_firms')
            .select('firm_name')
            .eq('id', conv.firm_id)
            .single();

          // Get client name
          const { data: clientData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', conv.client_id)
            .single();

          // Get case title if exists
          let caseTitle = null;
          if (conv.case_id) {
            const { data: caseData } = await supabase
              .from('cases')
              .select('title')
              .eq('id', conv.case_id)
              .single();
            caseTitle = caseData?.title;
          }

          // Get last message and unread count
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          return {
            ...conv,
            firm_name: firmData?.firm_name,
            client_name: clientData?.full_name,
            case_title: caseTitle,
            last_message: lastMsg?.content,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(enrichedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground text-center">Loading conversations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="border-b py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {conversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isClient 
                  ? 'Accept a firm\'s interest to start messaging'
                  : 'Get matched with a case to start messaging'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {conversations.map((conv) => {
                const displayName = isClient ? conv.firm_name : conv.client_name;
                const isSelected = selectedId === conv.id;
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => onSelectConversation(conv)}
                    className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                      isSelected ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {displayName?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">{displayName}</p>
                          {conv.unread_count && conv.unread_count > 0 && (
                            <Badge variant="default" className="text-xs">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                        {conv.case_title && (
                          <p className="text-xs text-muted-foreground truncate">
                            Re: {conv.case_title}
                          </p>
                        )}
                        {conv.last_message && (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {conv.last_message}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
