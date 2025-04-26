import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const googleApiKey = process.env.GOOGLE_GENAI_API_KEY;

if (!googleApiKey) {
  console.error(`
#################################################################
# ERROR: GOOGLE_GENAI_API_KEY environment variable is not set.  #
#                                                               #
# Please create a .env.local file in the project root:          #
#                                                               #
# .env.local                                                    #
# ----------                                                    #
# GOOGLE_GENAI_API_KEY=YOUR_API_KEY_HERE                        #
#                                                               #
# Get your API key from Google AI Studio:                       #
# https://aistudio.google.com/app/apikey                        #
#################################################################
  `);
   // Optionally, you could throw an error here to prevent the app from starting
   // throw new Error("GOOGLE_GENAI_API_KEY is not set.");
}


export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: googleApiKey, // Use the checked variable
    }),
  ],
  // Log level set to 'debug' for more detailed output, can be 'info' for less noise
  logLevel: 'debug',
  // Enable OpenTelemetry integration for better tracing (optional but helpful)
  // telemetry: {
  //   instrumentation: { /* configuration */ },
  //   exporter: { /* configuration */ },
  // },
});
