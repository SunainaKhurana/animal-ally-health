
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

class RealtimeSubscriptionManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscribers: Map<string, Set<(payload: any) => void>> = new Map();

  private getChannelKey(table: string, filter?: string): string {
    return filter ? `${table}_${filter}` : table;
  }

  subscribe(
    table: string,
    callback: (payload: any) => void,
    filter?: string
  ): () => void {
    const channelKey = this.getChannelKey(table, filter);
    
    // Add callback to subscribers
    if (!this.subscribers.has(channelKey)) {
      this.subscribers.set(channelKey, new Set());
    }
    this.subscribers.get(channelKey)!.add(callback);

    // Create channel if it doesn't exist
    if (!this.channels.has(channelKey)) {
      const channel = supabase.channel(`realtime_${channelKey}_${Date.now()}`);
      
      const config: any = {
        event: '*',
        schema: 'public',
        table: table
      };

      if (filter) {
        config.filter = filter;
      }

      channel.on('postgres_changes', config, (payload) => {
        const callbacks = this.subscribers.get(channelKey);
        if (callbacks) {
          callbacks.forEach(cb => {
            try {
              cb(payload);
            } catch (error) {
              console.error('Error in realtime callback:', error);
            }
          });
        }
      });

      channel.subscribe((status) => {
        console.log(`Channel ${channelKey} subscription status:`, status);
      });

      this.channels.set(channelKey, channel);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(channelKey);
      if (callbacks) {
        callbacks.delete(callback);
        
        // If no more subscribers, remove the channel
        if (callbacks.size === 0) {
          const channel = this.channels.get(channelKey);
          if (channel) {
            supabase.removeChannel(channel);
            this.channels.delete(channelKey);
            this.subscribers.delete(channelKey);
          }
        }
      }
    };
  }

  cleanup(): void {
    this.channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.subscribers.clear();
  }
}

export const realtimeManager = new RealtimeSubscriptionManager();
