import OpenAI from 'openai';
import { Readable } from 'stream';

// Define an asynchronous function to stream responses from ChatGPT
export async function streamChatGptText(prompt) {
  let openai;

  // Try initialize OpenAI with API key from environment variables
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('OpenAI SDK initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize OpenAI SDK:', error.message);
    throw error;
  }

  // Try stream responses from ChatGPT and handle potential errors
  try {
    const tools = [
      {
        "type": "function",
        "function": {
          "name": "get_current_weather",
          "description": "Get the current weather in a given location",
          "parameters": {
            "type": "object",
            "properties": {
              "location": {
                "type": "string",
                "description": "The city and state, e.g. San Francisco, CA",
              },
              "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
            },
            "required": ["location"],
          },
        }
      }
    ];

    // Create a stream of chat completions using the specified model and settings
    const chatGptResponseStream = await openai.chat.completions.create({
      messages: [{"role": "system", "content": "You are a helpful assistant."},{ role: 'user', content: prompt }],
      model: 'gpt-4-1106-preview', // Ensure you're using the correct model
      tools: tools,
      tool_choice: "auto",
      temperature: 1,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      seed: 1,
      stream: true,
    });

    console.log('Response stream received from OpenAI.');

    // Create a readable stream to handle the response
    const stream = new Readable({
      read() {} // Empty read function (no-op), as handling is done below
    });

    // Process each part of the response stream
    for await (const part of chatGptResponseStream) {
      // Log the content received in the response part, if any
      if (part.choices[0]?.delta?.content) {
        console.log('Received content:', part.choices[0].delta.content);
      }
    
      // Check for and log any function call attempts in the response
      if (part.choices[0]?.message?.tool_calls) {
        for (const toolCall of part.choices[0].message.tool_calls) {
          console.log('Function call attempt:', toolCall);
        }
      }
    
      // Push the received content to the stream
      stream.push(part.choices[0]?.delta?.content || '');
    }
    
    // Signal the end of the stream after processing all parts
    stream.push(null);
    console.log('End of response stream.');

    // Return the readable stream for further use
    return stream;
  } catch (error) {
    console.error('Error while streaming from ChatGPT API:', error.message);
    throw error; // Rethrow error for external handling
  }
}