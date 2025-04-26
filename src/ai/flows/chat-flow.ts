
'use server';
/**
 * @fileOverview Provides a chatbot flow for the Midnight Muse blog.
 *
 * - chatWithBot - Handles a chat interaction.
 * - ChatInput - Input type for the chat flow.
 * - ChatOutput - Output type for the chat flow.
 * - ChatMessage - Represents a single message in the chat history.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
// import { generate, CoreMessageData } from 'genkit/model'; // Uncomment if using direct generate example


// Define the structure for a single chat message (used for history)
const ChatMessageSchema = z.object({
    role: z.enum(['user', 'model']), // 'user' for user messages, 'model' for AI responses
    content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;


// Define the input schema for the chat flow
const ChatInputSchema = z.object({
  message: z.string().describe('The latest message from the user.'),
  // Optionally include history if needed for more context
   history: z.array(ChatMessageSchema).optional().describe('The recent chat history (optional).'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;


// Define the output schema for the chat flow
const ChatOutputSchema = z.object({
  response: z.string().describe('The AI chatbot\'s response to the user message.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;


// Exported wrapper function to call the flow
export async function chatWithBot(input: ChatInput): Promise<ChatOutput> {
  return chatbotFlow(input);
}


// Define the Genkit prompt
const chatPrompt = ai.definePrompt({
  name: 'midnightMuseChatPrompt',
  // History handling is done directly within the prompt template below for Gemini
  input: {
    schema: ChatInputSchema, // Use the defined input schema
  },
  output: {
    schema: ChatOutputSchema, // Use the defined output schema
  },
  prompt: `You are a friendly and helpful AI assistant for the "Midnight Muse" blog.
Your goal is to answer user questions about the blog's content, topics, authors, or help them navigate the site.
Be concise and helpful. If you don't know the answer, say so politely.

{{#if history}}
Chat History:
{{#each history}}
{{#if (eq role 'user')}}User: {{content}}{{/if}}
{{#if (eq role 'model')}}AI: {{content}}{{/if}}
{{/each}}
{{/if}}

Current User Message:
User: {{{message}}}

AI:`, // The prompt ends here, expecting the AI to continue the conversation
});

// Define the Genkit flow
const chatbotFlow = ai.defineFlow<typeof ChatInputSchema, typeof ChatOutputSchema>(
  {
    name: 'chatbotFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
     // Prepare messages for the model, including history if provided
     // Gemini uses a specific format for history turns
    // const messages: CoreMessageData[] = [];
    // if (input.history) {
    //     messages.push(...input.history.map(h => ({ role: h.role, content: [{ text: h.content }] })));
    // }
    // messages.push({ role: 'user', content: [{ text: input.message }] });


    // Call the prompt - it handles history internally via the Handlebars template
    const result = await chatPrompt(input);
    const output = result.output();

    if (!output) {
      throw new Error("Chatbot flow failed to generate a response.");
    }

    return output;
  }
);

// Note: The current implementation uses Handlebars templating for history.
// For more robust history management with Gemini, you might need to construct
// the message history array in the flow itself and pass it to `generate`.
// Example using generate directly (requires adjusting the prompt definition):
/*
const chatbotFlow = ai.defineFlow<typeof ChatInputSchema, typeof ChatOutputSchema>(
  {
    name: 'chatbotFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const historyMessages = (input.history || []).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
    }));

    const response = await generate({
      model: googleAI('gemini-1.5-flash'), // or your preferred model
      prompt: \`You are a friendly and helpful AI assistant for the "Midnight Muse" blog. Answer questions about blog content, topics, authors, or navigation. Be concise. If unsure, say so politely. \\n\\nUser: \${input.message}\\nAI:\`,
      history: historyMessages,
      output: { schema: ChatOutputSchema }
    });

    const output = response.output();
     if (!output) {
       throw new Error("Chatbot flow failed to generate a response.");
     }
    return output;
  }
);
*/
