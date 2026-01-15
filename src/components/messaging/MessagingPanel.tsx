import { useState } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';

interface Conversation {
  id: string;
  case_id: string | null;
  client_id: string;
  firm_id: string;
  created_at: string;
  firm_name?: string;
  client_name?: string;
  case_title?: string;
}

export function MessagingPanel() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <ConversationList
        onSelectConversation={setSelectedConversation}
        selectedId={selectedConversation?.id}
      />
      {selectedConversation ? (
        <ChatWindow
          conversation={selectedConversation}
          onClose={() => setSelectedConversation(null)}
        />
      ) : (
        <div className="hidden md:flex items-center justify-center border rounded-lg bg-muted/20 min-h-[400px]">
          <p className="text-muted-foreground text-sm">
            Select a conversation to start messaging
          </p>
        </div>
      )}
    </div>
  );
}
