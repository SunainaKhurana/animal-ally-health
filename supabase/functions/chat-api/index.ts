import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    const { conversation_id, user_id, pet_id, message, attachments } = await req.json();

    console.log('Received chat request:', { conversation_id, user_id, pet_id, message: message.substring(0, 100) + '...' });

    // Get pet information for context
    const { data: pet } = await supabase
      .from('pets')
      .select('name, breed, species, age_years, age_months, weight_kg, gender, pre_existing_conditions')
      .eq('id', pet_id)
      .single();

    // Get conversation history for context
    const { data: conversationMessages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(20); // Last 20 messages for context

    // Build context for the AI
    let systemPrompt = `You are a helpful veterinary AI assistant. You are chatting with a pet owner about their ${pet?.species || 'pet'} named ${pet?.name || 'the pet'}.

Pet Details:
- Name: ${pet?.name || 'Unknown'}
- Species: ${pet?.species || 'Unknown'}
- Breed: ${pet?.breed || 'Unknown'}  
- Age: ${pet?.age_years ? `${pet.age_years} years` : 'Unknown'}${pet?.age_months ? ` ${pet.age_months} months` : ''}
- Weight: ${pet?.weight_kg ? `${pet.weight_kg} kg` : 'Unknown'}
- Gender: ${pet?.gender || 'Unknown'}
- Pre-existing conditions: ${pet?.pre_existing_conditions?.length ? pet.pre_existing_conditions.join(', ') : 'None reported'}

Please provide helpful, accurate information while always recommending consulting with a veterinarian for serious concerns. Be conversational and supportive.`;

    // Build conversation history
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    if (conversationMessages && conversationMessages.length > 0) {
      conversationMessages.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // Add the current message
    messages.push({ role: 'user', content: message });

    console.log('Sending to Groq with', messages.length, 'messages');

    // Call Groq API with updated model
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
      throw new Error(`Groq API failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error('No response from Groq API');
      throw new Error('No response generated');
    }

    console.log('AI response generated successfully');

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-api function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: 'Check function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});