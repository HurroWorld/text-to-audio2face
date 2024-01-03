// Import necessary modules and classes
import OpenAI from 'openai';
import { Readable } from 'node:stream';

// Function to stream text from ChatGPT based on a given prompt
export async function streamChatGptText(prompt) {
  let openai;

  // Initialize OpenAI with API key from environment variables
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    console.error('Failed to initialise OpenAI SDK', error.message);
    throw error;
  }

  // Stream responses from ChatGPT and handle any errors
  try {
    const chatGptResponseStream = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
      stream: true,
    });

    const stream = new Readable({
      async read() {
        for await (const part of chatGptResponseStream) {
          this.push(part.choices[0]?.delta?.content || '');
        }
        this.push(null); // Signal end of stream
      },
    });

    return { stream };
  } catch (error) {
    console.error('Error while streaming from ChatGPT API:', error.message);
    throw error;
  }
}
