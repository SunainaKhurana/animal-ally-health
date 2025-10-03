export async function sendChatToAPI({
  accessToken,
  conversationId,
  petId,
  content,
  title,
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

  const body = {
    conversation_id: conversationId ?? null,
    pet_id: petId ?? null,
    content,
    title: title ?? null
  };

  const response = await fetch('https://pet-chat-api.vercel.app/api/chat/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Chat API error:', errorText);
    throw new Error(`Chat API failed: ${response.status} ${response.statusText}`);
  }

  return true;
}