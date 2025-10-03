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

  const body: Record<string, any> = { content };
  
  if (conversationId) {
    body.conversation_id = conversationId;
  } else {
    body.pet_id = petId;
    if (title) {
      body.title = title;
    }
  }

  const response = await fetch('https://pet-chat-api.vercel.app/api/chat/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Chat API error:', errorText);
    throw new Error(`Chat API failed: ${response.status} ${response.statusText}`);
  }

  // The assistant reply is streamed via realtime subscription
  // Do not parse response body
  return true;
}