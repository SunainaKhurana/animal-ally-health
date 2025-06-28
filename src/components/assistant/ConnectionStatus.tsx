
import { Wifi, WifiOff } from 'lucide-react';
import { ConnectionHealth } from '@/hooks/chat/types';

interface ConnectionStatusProps {
  connectionHealth: ConnectionHealth;
  pendingResponsesCount: number;
}

const ConnectionStatus = ({ connectionHealth, pendingResponsesCount }: ConnectionStatusProps) => {
  if (connectionHealth !== 'polling' && pendingResponsesCount === 0) {
    return null;
  }

  return (
    <div className="mb-3 flex items-center justify-center gap-2 text-xs text-gray-600">
      {connectionHealth === 'polling' ? (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Checking for responses...</span>
        </>
      ) : (
        <>
          <Wifi className="h-3 w-3" />
          <span>Waiting for {pendingResponsesCount} response{pendingResponsesCount !== 1 ? 's' : ''}...</span>
        </>
      )}
    </div>
  );
};

export default ConnectionStatus;
