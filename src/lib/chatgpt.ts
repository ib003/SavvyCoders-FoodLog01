/**
 * ChatGPT API Service
 * Handles communication with OpenAI's ChatGPT API
 */

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatGPTResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Get API key from environment variable
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

/**
 * Send a message to ChatGPT and get a response
 * @param messages - Array of conversation messages
 * @returns The AI response text
 */
export async function sendMessageToChatGPT(messages: Message[]): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your environment variables.');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[ChatGPT] API Error:', errorData);
      
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`API request failed: ${response.statusText}`);
      }
    }

    const data: ChatGPTResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from ChatGPT');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('[ChatGPT] Error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to communicate with ChatGPT');
  }
}

/**
 * Create a system prompt for the food tracking assistant
 */
export function getSystemPrompt(): string {
  return `You are a helpful assistant for a food tracking and allergy management app. 
You help users with:
- Questions about their meals and nutrition
- Understanding allergens and dietary restrictions
- Tracking symptoms related to food
- General health and wellness advice related to diet

Be concise, friendly, and helpful. If asked about medical advice, remind users to consult healthcare professionals.`;
}
