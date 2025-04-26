'use server';
/**
 * @fileOverview Simple chatbot flow for Midnight Muse.
 *
 * - chatFlow - Handles conversation based on history and new message.
 * - ChatFlowInput - Input type for the chat flow.
 * - ChatFlowOutput - Output type for the chat flow.
 */
import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Define the structure for a single message in the history (internal use)
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'bot']).describe('The role of the message sender (user or bot).'),
  content: z.string().describe('The text content of the message.'),
});

// Define the input schema (internal use)
const ChatFlowInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe('The previous conversation history.'),
  message: z.string().describe('The latest message from the user.'),
});

// Define the output schema (internal use)
const ChatFlowOutputSchema = z.object({
  reply: z.string().describe('The chatbot\'s response to the user\'s message.'),
});

// Export ONLY the types needed by client components
export type ChatFlowInput = z.infer<typeof ChatFlowInputSchema>;
export type ChatFlowOutput = z.infer<typeof ChatFlowOutputSchema>;


// Define the prompt (internal use)
const chatPrompt = ai.definePrompt({
  name: 'chatPrompt',
  input: { schema: ChatFlowInputSchema },
  output: { schema: ChatFlowOutputSchema },
  prompt: `You are a helpful assistant for the "Midnight Muse" blog. Your personality is knowledgeable, slightly witty, and encouraging of curiosity. Keep your responses concise and friendly.

  Here is the conversation history:
  {{#each history}}
  {{#if (eq role 'user')}}User: {{content}}{{/if}}
  {{#if (eq role 'bot')}}Assistant: {{content}}{{/if}}
  {{/each}}

  User: {{{message}}}
  Assistant:`,
});


// Define the Genkit Flow (internal use)
const internalChatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatFlowInputSchema,
    outputSchema: ChatFlowOutputSchema,
  },
  async (input) => {
    // Call the prompt with the input (history + new message)
    const result = await chatPrompt(input);
    const output = result.output();

    if (!output) {
        throw new Error("Chat prompt did not return an output.");
    }

    // Return the generated reply
    return output;
  }
);

// Export ONLY the async wrapper function for the flow
export async function chatFlow(input: ChatFlowInput): Promise<ChatFlowOutput> {
    return internalChatFlow(input);
}
