// Import the PlayHT module
import * as PlayHT from 'playht';

// Text-to-Speech configuration settings
const TTS_CONFIG = {
  voiceEngine: 'PlayHT2.0-turbo',
  voiceId: 's3://voice-cloning-zero-shot/801a663f-efd0-4254-98d0-5c175514c3e8/jennifer/manifest.json',
  outputFormat: 'mp3',
  // quality: 'high',
  emotion: 'female_happy',
  // styleGuidance: 25
};

// Function to convert a text stream to speech using PlayHT
export async function convertTextToSpeech(textStream) {
  // Initialize PlayHT with API keys from environment variables
  PlayHT.init({
    apiKey: process.env.PLAYHT_API_KEY,
    userId: process.env.PLAYHT_USER_ID,
  });

  // Convert the provided text stream to speech using PlayHT
  const stream = await PlayHT.stream(textStream, TTS_CONFIG);

  return { stream };
}
