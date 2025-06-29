
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChatMessage } from '@/hooks/useChatMessages';

interface ChatCache {
  [petId: string]: {
    messages: ChatMessage[];
    lastFetch: number;
    pendingReports: Set<number>;
  };
}

interface ChatCacheContextType {
  getCachedMessages: (petId: string) => ChatMessage[];
  setCachedMessages: (petId: string, messages: ChatMessage[]) => void;
  addMessage: (petId: string, message: ChatMessage) => void;
  updateMessage: (petId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  getPendingReports: (petId: string) => Set<number>;
  addPendingReport: (petId: string, reportId: number) => void;
  removePendingReport: (petId: string, reportId: number) => void;
  clearCache: (petId?: string) => void;
  getLastFetch: (petId: string) => number;
  setLastFetch: (petId: string, timestamp: number) => void;
}

const ChatCacheContext = createContext<ChatCacheContextType | undefined>(undefined);

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

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'pet-chat-cache';

export const ChatCacheProvider = ({ children }: ChatCacheProviderProps) => {
  const [cache, setCache] = useState<ChatCache>({});

  // Load cache from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedCache = JSON.parse(stored);
        
        // Convert pendingReports arrays back to Sets and filter expired entries
        const now = Date.now();
        const cleanedCache: ChatCache = {};
        
        Object.entries(parsedCache).forEach(([petId, data]: [string, any]) => {
          if (now - data.lastFetch < CACHE_EXPIRY) {
            cleanedCache[petId] = {
              messages: data.messages || [],
              lastFetch: data.lastFetch || 0,
              pendingReports: new Set(data.pendingReports || [])
            };
          }
        });
        
        setCache(cleanedCache);
      }
    } catch (error) {
      console.error('Failed to load chat cache:', error);
    }
  }, []);

  // Save cache to localStorage whenever it changes
  useEffect(() => {
    try {
      const cacheToStore = Object.fromEntries(
        Object.entries(cache).map(([petId, data]) => [
          petId,
          {
            messages: data.messages,
            lastFetch: data.lastFetch,
            pendingReports: Array.from(data.pendingReports)
          }
        ])
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheToStore));
    } catch (error) {
      console.error('Failed to save chat cache:', error);
    }
  }, [cache]);

  const getCachedMessages = (petId: string): ChatMessage[] => {
    return cache[petId]?.messages || [];
  };

  const setCachedMessages = (petId: string, messages: ChatMessage[]) => {
    setCache(prev => ({
      ...prev,
      [petId]: {
        ...prev[petId],
        messages,
        lastFetch: Date.now(),
        pendingReports: prev[petId]?.pendingReports || new Set()
      }
    }));
  };

  const addMessage = (petId: string, message: ChatMessage) => {
    setCache(prev => ({
      ...prev,
      [petId]: {
        ...prev[petId],
        messages: [...(prev[petId]?.messages || []), message],
        lastFetch: prev[petId]?.lastFetch || Date.now(),
        pendingReports: prev[petId]?.pendingReports || new Set()
      }
    }));
  };

  const updateMessage = (petId: string, messageId: string, updates: Partial<ChatMessage>) => {
    setCache(prev => ({
      ...prev,
      [petId]: {
        ...prev[petId],
        messages: (prev[petId]?.messages || []).map(msg => 
          msg.id === messageId ? { ...msg, ...updates } : msg
        ),
        lastFetch: prev[petId]?.lastFetch || Date.now(),
        pendingReports: prev[petId]?.pendingReports || new Set()
      }
    }));
  };

  const getPendingReports = (petId: string): Set<number> => {
    return cache[petId]?.pendingReports || new Set();
  };

  const addPendingReport = (petId: string, reportId: number) => {
    setCache(prev => ({
      ...prev,
      [petId]: {
        ...prev[petId],
        messages: prev[petId]?.messages || [],
        lastFetch: prev[petId]?.lastFetch || Date.now(),
        pendingReports: new Set([...(prev[petId]?.pendingReports || []), reportId])
      }
    }));
  };

  const removePendingReport = (petId: string, reportId: number) => {
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
  };

  const clearCache = (petId?: string) => {
    if (petId) {
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[petId];
        return newCache;
      });
    } else {
      setCache({});
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const getLastFetch = (petId: string): number => {
    return cache[petId]?.lastFetch || 0;
  };

  const setLastFetch = (petId: string, timestamp: number) => {
    setCache(prev => ({
      ...prev,
      [petId]: {
        ...prev[petId],
        messages: prev[petId]?.messages || [],
        lastFetch: timestamp,
        pendingReports: prev[petId]?.pendingReports || new Set()
      }
    }));
  };

  const value: ChatCacheContextType = {
    getCachedMessages,
    setCachedMessages,
    addMessage,
    updateMessage,
    getPendingReports,
    addPendingReport,
    removePendingReport,
    clearCache,
    getLastFetch,
    setLastFetch
  };

  return (
    <ChatCacheContext.Provider value={value}>
      {children}
    </ChatCacheContext.Provider>
  );
};
