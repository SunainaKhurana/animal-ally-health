import { supabase } from "@/integrations/supabase/client";

export async function sendChatToAPI({
  accessToken,              // Supabase session access token (string)
  conversationId,           // existing conversation id (string | undefined)
  petId,                    // required if conversationId is undefined (string | undefined)
  content,                  // user message text (string)
  title,                    // optional (string)
}: {
  accessToken: string;
  conversationId?: string;
  petId?: string;
  content: string;
  title?: string;
}) {
  if (!accessToken) throw new Error("No access token");
  if (!content) throw new Error("No content");
  if (!conversationId && !petId) throw new Error("Need conversationId or petId");

  const { data, error } = await supabase.functions.invoke('chat-send', {
    body: {
      conversation_id: conversationId ?? null,
      pet_id: conversationId ? null : petId,
      content,
      title: title ?? null,
    },
  });

  if (error) {
    console.error('Chat API error:', error);
    throw new Error(`Chat API failed: ${error.message}`);
  }

  // The assistant reply is streamed via realtime subscription
  return true;
}