import OpenAI from 'openai';
import { Readable } from 'stream';

export async function streamChatGptText(prompt) {
  let openai;

  // Initialize OpenAI with API key from environment variables
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('OpenAI SDK initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize OpenAI SDK:', error.message);
    throw error;
  }

  // Stream responses from ChatGPT and handle any errors
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

    const stream = new Readable({
      read() {} // No-op implementation of read method
    });

    for await (const part of chatGptResponseStream) {
      // Check if the response part has content and log it
      if (part.choices[0]?.delta?.content) {
        console.log('Received content:', part.choices[0].delta.content);
      }
    
      // Check for function call attempts and log details
      if (part.choices[0]?.message?.tool_calls) {
        for (const toolCall of part.choices[0].message.tool_calls) {
          console.log('Function call attempt:', toolCall);
        }
      }
    
      stream.push(part.choices[0]?.delta?.content || '');
    }
    

    stream.push(null); // Signal end of stream
    console.log('End of response stream.');

    return stream;
  } catch (error) {
    console.error('Error while streaming from ChatGPT API:', error.message);
    throw error;
  }
}
