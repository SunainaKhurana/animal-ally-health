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

  const res = await fetch("https://pet-chat-api.vercel.app/api/chat/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversation_id: conversationId ?? null,
      pet_id: conversationId ? null : petId,
      content,
      title: title ?? null,
    }),
  });

  // We stream the assistant reply via realtime, so here we only need to check for 2xx/4xx.
  if (!res.ok) {
    let details = "";
    try { details = await res.text(); } catch {}
    throw new Error(`API ${res.status}: ${details}`);
  }
  // Do not parse JSON here; the server streams the reply separately.
  return true;
}