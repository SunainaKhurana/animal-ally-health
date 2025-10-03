import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const groqApiKey = Deno.env.get('GROQ_API_KEY');

    if (!groqApiKey) {
      console.error('GROQ_API_KEY is not set');
      return new Response(JSON.stringify({ error: 'GROQ_API_KEY is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token!);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { conversation_id, pet_id, content, title } = await req.json();

    if (!content?.trim()) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let activeConversationId = conversation_id;

    // Create new conversation if needed
    if (!conversation_id && pet_id) {
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          pet_id,
          user_id: user.id,
          title: title || 'Chat with AI Assistant',
          status: 'open'
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return new Response(JSON.stringify({ error: 'Failed to create conversation' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      activeConversationId = newConversation.id;
    }

    if (!activeConversationId) {
      return new Response(JSON.stringify({ error: 'Conversation ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert user message
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: activeConversationId,
        role: 'user',
        content: content.trim()
      });

    if (userMsgError) {
      console.error('Error inserting user message:', userMsgError);
      return new Response(JSON.stringify({ error: 'Failed to save message' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get pet information
    const { data: conversation } = await supabase
      .from('conversations')
      .select('pet_id')
      .eq('id', activeConversationId)
      .single();

    const { data: pet } = await supabase
      .from('pets')
      .select('name, breed, species, age_years, age_months, weight_kg, gender, pre_existing_conditions')
      .eq('id', conversation?.pet_id)
      .single();

    // Get conversation history
    const { data: conversationMessages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', activeConversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    const systemPrompt = `You are a helpful veterinary AI assistant. You are chatting with a pet owner about their ${pet?.species || 'pet'} named ${pet?.name || 'the pet'}.

Pet Details:
- Name: ${pet?.name || 'Unknown'}
- Species: ${pet?.species || 'Unknown'}
- Breed: ${pet?.breed || 'Unknown'}  
- Age: ${pet?.age_years ? `${pet.age_years} years` : 'Unknown'}${pet?.age_months ? ` ${pet.age_months} months` : ''}
- Weight: ${pet?.weight_kg ? `${pet.weight_kg} kg` : 'Unknown'}
- Gender: ${pet?.gender || 'Unknown'}
- Pre-existing conditions: ${pet?.pre_existing_conditions?.length ? pet.pre_existing_conditions.join(', ') : 'None reported'}

Please provide helpful, accurate information while always recommending consulting with a veterinarian for serious concerns. Be conversational and supportive.`;

    const messages = [{ role: 'system', content: systemPrompt }];

    if (conversationMessages && conversationMessages.length > 0) {
      conversationMessages.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    console.log('Calling Groq API with', messages.length, 'messages');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      throw new Error(`Groq API failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response generated');
    }

    // Insert assistant message
    const { error: assistantMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: activeConversationId,
        role: 'assistant',
        content: aiResponse
      });

    if (assistantMsgError) {
      console.error('Error inserting assistant message:', assistantMsgError);
      return new Response(JSON.stringify({ error: 'Failed to save AI response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Chat completed successfully');

    return new Response(JSON.stringify({ success: true, conversation_id: activeConversationId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-send function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
