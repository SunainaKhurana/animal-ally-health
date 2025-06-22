
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportData, petInfo } = await req.json();
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create analysis prompt
    const prompt = createAnalysisPrompt(reportData, petInfo);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a veterinary AI assistant. Analyze health reports and provide educational insights. Always include disclaimers about consulting with a licensed veterinarian.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    // Generate vet questions
    const questionsPrompt = `Based on this health report analysis, generate 5-7 specific questions that a pet owner should ask their veterinarian:

${analysis}

Format as a JSON array of strings.`;

    const questionsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Generate specific, actionable questions for pet owners to ask their veterinarian. Return only a valid JSON array.'
          },
          {
            role: 'user',
            content: questionsPrompt
          }
        ],
        temperature: 0.5,
      }),
    });

    const questionsData = await questionsResponse.json();
    let vetQuestions = [];
    
    try {
      vetQuestions = JSON.parse(questionsData.choices[0].message.content);
    } catch (e) {
      console.error('Failed to parse vet questions:', e);
      vetQuestions = [
        "What do these results mean for my pet's overall health?",
        "Are there any values that require immediate attention?",
        "What lifestyle or dietary changes should I consider?",
        "How often should we retest these parameters?",
        "Are there any symptoms I should watch for?"
      ];
    }

    return new Response(JSON.stringify({ 
      analysis,
      vetQuestions,
      disclaimer: "⚠️ This analysis is AI-generated and for educational purposes only. Always consult with a licensed veterinarian for professional medical advice and treatment decisions."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-health-report function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function createAnalysisPrompt(reportData: any, petInfo: any): string {
  return `Please analyze this veterinary health report for a ${petInfo?.type || 'pet'} named ${petInfo?.name || 'the pet'}:

**Report Type:** ${reportData.reportType || 'Unknown'}
**Date:** ${reportData.reportDate || 'Not specified'}
**Veterinarian:** ${reportData.veterinarian || 'Not specified'}

**Parameters:**
${reportData.parameters?.map((p: any) => 
  `- ${p.name}: ${p.value} ${p.unit || ''} (Reference: ${p.referenceRange || 'N/A'}) [Status: ${p.status || 'Unknown'}]`
).join('\n') || 'No parameters extracted'}

**Findings:**
${reportData.findings?.join('\n') || 'No specific findings noted'}

**Recommendations:**
${reportData.recommendations?.join('\n') || 'No specific recommendations noted'}

Please provide:
1. **Summary**: Brief overview of the report
2. **Key Findings**: Highlight abnormal values and their potential significance
3. **Trends to Monitor**: What parameters should be tracked over time
4. **General Health Insights**: Educational information about the pet's health status
5. **When to Contact Vet**: Signs or symptoms that warrant immediate veterinary attention

Important: Include appropriate disclaimers about this being educational information only and the importance of veterinary consultation.`;
}
