// Gemini AI Service for Chatbot
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Using gemini-2.0-flash - stable and widely available model
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// System instruction for better formatting
const SYSTEM_INSTRUCTION = `You are a helpful, friendly AI assistant. Format your responses to be clear and organized:
- Use emojis sparingly to make responses friendly 😊
- Use bullet points (•) for lists
- Use line breaks to separate sections
- Keep responses concise but informative
- Be conversational and warm
- When explaining technical topics, break them into simple points
- DO NOT use markdown formatting like **bold** or *italic* - just use plain text
- DO NOT use # for headings - just use plain text with emojis if needed`;

/**
 * Send a message to Gemini AI and get a response
 * @param {string} userMessage - The user's message
 * @returns {Promise<string>} AI response text
 */
export const getGeminiResponse = async (userMessage) => {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not configured');
    return null;
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userMessage }]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 429 || data.error?.status === 'RESOURCE_EXHAUSTED') {
        console.warn('Gemini rate limit hit');
        return null;
      }
      console.error('Gemini API error:', response.status, data);
      return null;
    }

    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error('No response text in Gemini response:', data);
      return null;
    }

    return responseText;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return null;
  }
};

/**
 * Check if Gemini API is configured
 * @returns {boolean}
 */
export const isGeminiConfigured = () => {
  return !!GEMINI_API_KEY;
};
