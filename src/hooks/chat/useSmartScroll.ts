
import { useRef, useEffect, useCallback, useState } from 'react';

interface UseSmartScrollOptions {
  messages: any[];
  threshold?: number;
}

export const useSmartScroll = ({ messages, threshold = 100 }: UseSmartScrollOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const lastMessageCountRef = useRef(messages.length);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Check if user is near bottom of container
  const isNearBottom = useCallback(() => {
    if (!containerRef.current) return false;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom <= threshold;
  }, [threshold]);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const nearBottom = isNearBottom();
    setShowScrollToBottom(!nearBottom);
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set user scrolling flag
    setIsUserScrolling(true);
    
    // Clear user scrolling flag after scroll stops
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 150);
  }, [isNearBottom]);

  // Auto-scroll logic for new messages
  useEffect(() => {
    const messageCountChanged = messages.length !== lastMessageCountRef.current;
    const hasNewMessages = messages.length > lastMessageCountRef.current;
    
    if (messageCountChanged) {
      // If loading historical messages (messages decreased or same), preserve position
      if (!hasNewMessages) {
        // This is likely historical data loading, don't auto-scroll
        lastMessageCountRef.current = messages.length;
        return;
      }

      // For new messages, only auto-scroll if user was near bottom or not actively scrolling
      if (!isUserScrolling && (isNearBottom() || lastMessageCountRef.current === 0)) {
        // Use requestAnimationFrame for smooth scrolling
        requestAnimationFrame(() => {
          scrollToBottom('smooth');
        });
      }
      
      lastMessageCountRef.current = messages.length;
    }
  }, [messages.length, isUserScrolling, isNearBottom, scrollToBottom]);

  // Initial scroll to bottom when component mounts with messages
  useEffect(() => {
    if (messages.length > 0 && lastMessageCountRef.current === 0) {
      // Use instant scroll for initial load
      setTimeout(() => {
        scrollToBottom('instant');
      }, 100);
    }
  }, [messages.length, scrollToBottom]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    containerRef,
    messagesEndRef,
    handleScroll,
    scrollToBottom,
    showScrollToBottom,
    isUserScrolling
  };
};
