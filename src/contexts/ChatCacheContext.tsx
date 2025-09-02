
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ChatMessage } from '@/hooks/chat/types';

interface ChatCache {
  [petId: string]: {
    messages: ChatMessage[];
    lastUpdated: number;
    version: string;
    pendingReports: Set<number>;
    lastFetch: number;
  };
}

interface ChatCacheContextType {
  getCachedMessages: (petId: string) => ChatMessage[];
  setCachedMessages: (petId: string, messages: ChatMessage[]) => void;
  addMessage: (petId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => ChatMessage;
  updateMessage: (petId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  clearCache: (petId?: string) => void;
  getCacheSize: () => number;
  invalidateCache: (petId: string) => void;
  isCacheValid: (petId: string) => boolean;
  getPendingReports: (petId: string) => Set<number>;
  addPendingReport: (petId: string, reportId: number) => void;
  removePendingReport: (petId: string, reportId: number) => void;
  getLastFetch: (petId: string) => number;
  setLastFetch: (petId: string, timestamp: number) => void;
}

const ChatCacheContext = createContext<ChatCacheContextType | undefined>(undefined);

const CACHE_VERSION = '2.0.0';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 50; // Maximum messages per pet

export const useChatCache = () => {
  const context = useContext(ChatCacheContext);
  if (context === undefined) {
    throw new Error('useChatCache must be used within a ChatCacheProvider');
  }
  return context;
};

interface ChatCacheProviderProps {
  children: ReactNode;
}

export const ChatCacheProvider = ({ children }: ChatCacheProviderProps) => {
  const [cache, setCache] = useState<ChatCache>(() => {
    try {
      const saved = localStorage.getItem('petChatCache');
      const parsedCache = saved ? JSON.parse(saved) : {};
      
      // Validate cache version and expire old entries
      const validatedCache: ChatCache = {};
      Object.entries(parsedCache).forEach(([petId, data]: [string, any]) => {
        if (data && typeof data === 'object' && 'version' in data && data.version === CACHE_VERSION) {
          const cacheAge = Date.now() - (data.lastUpdated || 0);
          if (cacheAge < CACHE_EXPIRY) {
            validatedCache[petId] = {
              messages: data.messages || [],
              lastUpdated: data.lastUpdated || Date.now(),
              version: CACHE_VERSION,
              pendingReports: new Set(data.pendingReports || []),
              lastFetch: data.lastFetch || 0
            };
          }
        }
      });
      
      return validatedCache;
    } catch (error) {
      console.error('Error loading chat cache:', error);
      return {};
    }
  });

  // Save to localStorage whenever cache changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        const cacheToStore = Object.fromEntries(
          Object.entries(cache).map(([petId, data]) => [
            petId,
            {
              messages: data.messages,
              lastUpdated: data.lastUpdated,
              version: data.version,
              pendingReports: Array.from(data.pendingReports),
              lastFetch: data.lastFetch
            }
          ])
        );
        localStorage.setItem('petChatCache', JSON.stringify(cacheToStore));
      } catch (error) {
        console.error('Error saving chat cache:', error);
        // If storage is full, clear oldest entries
        if (error.name === 'QuotaExceededError') {
          const sortedPets = Object.entries(cache).sort(([,a], [,b]) => a.lastUpdated - b.lastUpdated);
          const newCache = Object.fromEntries(sortedPets.slice(-Math.floor(sortedPets.length * 0.7)));
          setCache(newCache);
        }
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [cache]);

  const getCachedMessages = useCallback((petId: string): ChatMessage[] => {
    const petCache = cache[petId];
    return petCache?.messages || [];
  }, [cache]);

  const setCachedMessages = useCallback((petId: string, messages: ChatMessage[]) => {
    setCache(prev => ({
      ...prev,
      [petId]: {
        messages: messages.slice(-MAX_CACHE_SIZE), // Limit cache size
        lastUpdated: Date.now(),
        version: CACHE_VERSION,
        pendingReports: prev[petId]?.pendingReports || new Set(),
        lastFetch: prev[petId]?.lastFetch || Date.now()
      }
    }));
  }, []);

  const addMessage = useCallback((petId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    setCache(prev => {
      const currentMessages = prev[petId]?.messages || [];
      const updatedMessages = [...currentMessages, newMessage].slice(-MAX_CACHE_SIZE);
      
      return {
        ...prev,
        [petId]: {
          messages: updatedMessages,
          lastUpdated: Date.now(),
          version: CACHE_VERSION,
          pendingReports: prev[petId]?.pendingReports || new Set(),
          lastFetch: prev[petId]?.lastFetch || Date.now()
        }
      };
    });

    return newMessage;
  }, []);

  const updateMessage = useCallback((petId: string, messageId: string, updates: Partial<ChatMessage>) => {
    setCache(prev => {
      const petCache = prev[petId];
      if (!petCache) return prev;
      
      const updatedMessages = petCache.messages.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      );
      
      return {
        ...prev,
        [petId]: {
          ...petCache,
          messages: updatedMessages,
          lastUpdated: Date.now()
        }
      };
    });
  }, []);

  const getPendingReports = useCallback((petId: string): Set<number> => {
    return cache[petId]?.pendingReports || new Set();
  }, [cache]);

  const addPendingReport = useCallback((petId: string, reportId: number) => {
    setCache(prev => ({
      ...prev,
      [petId]: {
        ...prev[petId],
        messages: prev[petId]?.messages || [],
        lastUpdated: prev[petId]?.lastUpdated || Date.now(),
        version: CACHE_VERSION,
        pendingReports: new Set([...(prev[petId]?.pendingReports || []), reportId]),
        lastFetch: prev[petId]?.lastFetch || Date.now()
      }
    }));
  }, []);

  const removePendingReport = useCallback((petId: string, reportId: number) => {
    setCache(prev => {
      const petCache = prev[petId];
      if (!petCache) return prev;
      
      const newPendingReports = new Set(petCache.pendingReports);
      newPendingReports.delete(reportId);
      
      return {
        ...prev,
        [petId]: {
          ...petCache,
          pendingReports: newPendingReports
        }
      };
    });
  }, []);

  const getLastFetch = useCallback((petId: string): number => {
    return cache[petId]?.lastFetch || 0;
  }, [cache]);

  const setLastFetch = useCallback((petId: string, timestamp: number) => {
    setCache(prev => ({
      ...prev,
      [petId]: {
        ...prev[petId],
        messages: prev[petId]?.messages || [],
        lastUpdated: prev[petId]?.lastUpdated || Date.now(),
        version: CACHE_VERSION,
        pendingReports: prev[petId]?.pendingReports || new Set(),
        lastFetch: timestamp
      }
    }));
  }, []);

  const clearCache = useCallback((petId?: string) => {
    if (petId) {
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[petId];
        return newCache;
      });
    } else {
      setCache({});
      localStorage.removeItem('petChatCache');
    }
  }, []);

  const getCacheSize = useCallback((): number => {
    return Object.values(cache).reduce((total, petCache) => total + (petCache?.messages?.length || 0), 0);
  }, [cache]);

  const invalidateCache = useCallback((petId: string) => {
    setCache(prev => {
      const petCache = prev[petId];
      if (!petCache) return prev;
      
      return {
        ...prev,
        [petId]: {
          ...petCache,
          lastUpdated: 0, // Force refresh
        }
      };
    });
  }, []);

  const isCacheValid = useCallback((petId: string): boolean => {
    const petCache = cache[petId];
    if (!petCache) return false;
    
    const cacheAge = Date.now() - petCache.lastUpdated;
    return cacheAge < CACHE_EXPIRY && petCache.version === CACHE_VERSION;
  }, [cache]);

  const value: ChatCacheContextType = {
    getCachedMessages,
    setCachedMessages,
    addMessage,
    updateMessage,
    clearCache,
    getCacheSize,
    invalidateCache,
    isCacheValid,
    getPendingReports,
    addPendingReport,
    removePendingReport,
    getLastFetch,
    setLastFetch
  };

  return (
    <ChatCacheContext.Provider value={value}>
      {children}
    </ChatCacheContext.Provider>
  );
};
