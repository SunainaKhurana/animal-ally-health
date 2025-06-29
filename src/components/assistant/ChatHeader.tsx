
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ConnectionStatus from './ConnectionStatus';
import { ConnectionHealth } from '@/hooks/chat/types';

interface ChatHeaderProps {
  connectionHealth: ConnectionHealth;
  pendingResponsesCount: number;
  onLogSymptoms: () => void;
}

const ChatHeader = ({ connectionHealth, pendingResponsesCount, onLogSymptoms }: ChatHeaderProps) => {
  return (
    <div className="p-4 border-b">
      <ConnectionStatus
        connectionHealth={connectionHealth}
        pendingResponsesCount={pendingResponsesCount}
      />
      
      <Button
        onClick={onLogSymptoms}
        className="w-full bg-red-500 hover:bg-red-600 text-white"
        size="lg"
      >
        <Plus className="h-4 w-4 mr-2" />
        Log Symptoms
      </Button>
    </div>
  );
};

export default ChatHeader;
