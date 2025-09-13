import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
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
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

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

  // Load messages for the current conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setLoading(true);
      
      const { data: messagesData, error } = await (supabase as any)
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        throw error;
      }

      console.log('Loaded messages:', messagesData?.length || 0);
      setMessages(messagesData || []);

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
    if (!conversation || !user || !petId) {
      console.error('Cannot send message: missing conversation, user, or petId');
      return;
    }

    try {
      setSendingMessage(true);

      // First, store the user message in Supabase
      const { data: userMessage, error: userMessageError } = await (supabase as any)
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'user',
          content,
          attachments
        })
        .select()
        .single();

      if (userMessageError) {
        console.error('Error storing user message:', userMessageError);
        throw userMessageError;
      }

      // Add user message to local state immediately
      setMessages(prev => [...prev, userMessage]);

      // Call the Supabase Edge Function
      const response = await fetch('https://yertfmwobyvkwghvnyku.supabase.co/functions/v1/chat-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllcnRmbXdvYnl2a3dnaHZueWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDg2MzcsImV4cCI6MjA2NTk4NDYzN30.7jdoINFhuhR45G3XkDAykBYPNLaltVUeyHzRWRA6x3g`,
        },
        body: JSON.stringify({
          conversation_id: conversation.id,
          user_id: user.id,
          pet_id: petId,
          message: content,
          attachments
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      const apiResponse = await response.json();
      console.log('API response received:', apiResponse);

      // Store the AI response in Supabase
      if (apiResponse.response) {
        const { data: aiMessage, error: aiMessageError } = await (supabase as any)
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            role: 'assistant',
            content: apiResponse.response,
          })
          .select()
          .single();

        if (aiMessageError) {
          console.error('Error storing AI message:', aiMessageError);
          throw aiMessageError;
        }

        // Add AI message to local state
        setMessages(prev => [...prev, aiMessage]);
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  }, [conversation, user, petId, toast]);

  // Initialize conversation and load messages when pet changes
  useEffect(() => {
    const initializeChat = async () => {
      if (!petId || !user) {
        setConversation(null);
        setMessages([]);
        return;
      }

      const conv = await getOrCreateConversation();
      if (conv) {
        setConversation(conv);
        await loadMessages(conv.id);
      }
    };

    initializeChat();
  }, [petId, user, getOrCreateConversation, loadMessages]);

  // Subscribe to real-time messages for this conversation
  useEffect(() => {
    if (!conversation) return;

    console.log('Setting up real-time subscription for conversation:', conversation.id);

    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          console.log('New message received via real-time:', payload.new);
          const newMessage = payload.new as Message;
          
          // Only add if it's not already in our local state
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
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