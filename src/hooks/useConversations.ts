import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'typing';
  content: string;
  created_at: string;
  attachments?: any;
}

export interface Conversation {
  id: string;
  pet_id: string;
  user_id: string;
  title?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useConversations = (petId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Helper function to sort messages by created_at
  const sortMessagesByTime = (msgs: Message[]) => {
    return [...msgs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [typingLoaderId, setTypingLoaderId] = useState<string | null>(null);

  // Get or create conversation for the current pet
  const getOrCreateConversation = useCallback(async () => {
    if (!petId || !user) return null;

    try {
      // First, try to get existing conversation
      const { data: existingConversation, error: fetchError } = await (supabase as any)
        .from('conversations')
        .select('*')
        .eq('pet_id', petId)
        .eq('user_id', user.id)
        .eq('status', 'open')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching conversation:', fetchError);
        return null;
      }

      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation.id);
        return existingConversation;
      }

      // Create new conversation if none exists
      const { data: newConversation, error: createError } = await (supabase as any)
        .from('conversations')
        .insert({
          pet_id: petId,
          user_id: user.id,
          title: 'Chat with AI Assistant',
          status: 'open'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating conversation:', createError);
        throw createError;
      }

      console.log('Created new conversation:', newConversation.id);
      return newConversation;

    } catch (error: any) {
      console.error('Error in getOrCreateConversation:', error);
      toast({
        title: "Error",
        description: "Failed to initialize conversation. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  }, [petId, user, toast]);

  // Load messages for the current conversation (last 20 only)
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setLoading(true);
      
      const { data: messagesData, error } = await (supabase as any)
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading messages:', error);
        throw error;
      }

      // Reverse to show chronological order (oldest first)
      const orderedMessages = messagesData ? messagesData.reverse() : [];
      console.log('Loaded messages:', orderedMessages.length);
      setMessages(sortMessagesByTime(orderedMessages));

    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Send message through API and store in Supabase
  const sendMessage = useCallback(async (content: string, attachments?: any) => {
    // Validate required fields before sending
    if (!content?.trim()) {
      console.error('Cannot send message: content is required');
      toast({
        title: "Error",
        description: "Message content is required.",
        variant: "destructive",
      });
      return;
    }

    if (!petId) {
      console.error('Cannot send message: pet_id is required');
      toast({
        title: "Error",
        description: "Please select a pet first.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      console.error('Cannot send message: user is required');
      return;
    }

    try {
      setSendingMessage(true);

      // Create user message immediately and add to local state
      const userMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversation?.id || '',
        role: 'user',
        content: content.trim(),
        created_at: new Date().toISOString(),
        attachments
      };

      // Immediately append user message to local state (optimistic UI)
      setMessages(prev => sortMessagesByTime([...prev, userMessage]));

      // Add typing loader immediately after user message
      const typingId = crypto.randomUUID();
      setTypingLoaderId(typingId);
      const typingMessage: Message = {
        id: typingId,
        conversation_id: conversation?.id || '',
        role: 'typing',
        content: 'Assistant is typing...',
        created_at: new Date(Date.now() + 1).toISOString() // Ensure it comes after user message
      };
      setMessages(prev => sortMessagesByTime([...prev, typingMessage]));

      // Get the current session and access token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session found. Please sign in again.');
      }

      // Call the external Vercel API endpoint (but don't append assistant response)
      const response = await fetch('https://pet-chat-api.vercel.app/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          conversation_id: conversation?.id || null,
          pet_id: petId,
          content: content.trim()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response error:', response.status, errorText);
        // Remove typing loader on error
        setMessages(prev => prev.filter(m => m.id !== typingId));
        setTypingLoaderId(null);
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      const apiResponse = await response.json();
      console.log('API response received:', apiResponse);

      // Update conversation if a new one was created
      if (apiResponse.conversation_id && (!conversation || conversation.id !== apiResponse.conversation_id)) {
        setConversation(prev => prev ? { ...prev, id: apiResponse.conversation_id } : null);
      }

      // Don't append assistant message here - wait for realtime subscription

    } catch (error: any) {
      console.error('Error sending message:', error);
      // Remove typing loader on error
      if (typingLoaderId) {
        setMessages(prev => prev.filter(m => m.id !== typingLoaderId));
        setTypingLoaderId(null);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  }, [conversation, user, petId, toast, typingLoaderId]);

  // Initialize conversation and load messages when pet changes
  useEffect(() => {
    const initializeChat = async () => {
      if (!petId || !user) {
        setConversation(null);
        setMessages([]);
        setTypingLoaderId(null); // Clear typing loader when switching pets
        return;
      }

      // Clear any existing typing loader when switching conversations
      setTypingLoaderId(null);

      const conv = await getOrCreateConversation();
      if (conv) {
        setConversation(conv);
        await loadMessages(conv.id);
      }
    };

    initializeChat();
  }, [petId, user, getOrCreateConversation, loadMessages]);

  // Subscribe to real-time messages for this conversation only
  useEffect(() => {
    if (!conversation) {
      // Clear typing loader if no conversation
      setTypingLoaderId(null);
      return;
    }

    console.log('Setting up real-time subscription for conversation:', conversation.id);

    const channel = supabase
      .channel(`chat-${conversation.id}`) // Use unique channel name per conversation
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          console.log('Real-time message event:', payload.eventType, payload.new);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            const newMessage = payload.new as Message;
            
            // If this is an assistant message, immediately remove typing loader and display message
            if (newMessage.role === 'assistant') {
              setMessages(prev => {
                // Remove any typing loaders and add the assistant message
                const withoutTyping = prev.filter(m => m.role !== 'typing');
                // Avoid duplicates
                if (withoutTyping.some(m => m.id === newMessage.id)) {
                  return withoutTyping;
                }
                return sortMessagesByTime([...withoutTyping, newMessage]);
              });
              setTypingLoaderId(null); // Clear typing loader state
            } else if (newMessage.role === 'user') {
              // Only add user messages if they're not already in local state (from optimistic UI)
              setMessages(prev => {
                const exists = prev.some(msg => msg.id === newMessage.id);
                if (exists) return prev;
                return sortMessagesByTime([...prev, newMessage]);
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
      // Clear typing loader when cleaning up subscription
      setTypingLoaderId(null);
    };
  }, [conversation]);

  return {
    conversation,
    messages,
    loading,
    sendingMessage,
    sendMessage,
    refreshMessages: () => conversation && loadMessages(conversation.id)
  };
};