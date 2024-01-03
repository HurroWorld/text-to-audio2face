import dotenv from 'dotenv';
import express from 'express';
import { Readable } from 'stream';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import EventEmitter from 'events';
import axios from 'axios';

import { streamChatGptText } from './chatGptStream.js';
import { convertTextToSpeech } from './playhtTTS.js';
import { streamAudioToA2F } from './grpcClient.js';

dotenv.config();
EventEmitter.defaultMaxListeners = 100;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

// Function to load USD Scene
async function loadUsdScene(serverUrl, usdScenePath) {
  try {
    const payload = { file_name: usdScenePath };
    const response = await axios.post(`${serverUrl}/A2F/USD/Load`, payload);
    console.log(`USD scene loaded: ${response.data}`);
    return response.data;
  } catch (error) {
    console.error(`Error loading USD scene: ${error.message}`);
    return null;
  }
}

const loadUsdSceneAtStart = true;

if (loadUsdSceneAtStart) {
  // Load USD scene at the start
  const serverUrl = 'http://localhost:8011';
  const usdScenePath = 'D:/Code/text-to-audio2face/stream-livelink.usd'; // Replace with your USD scene path
  loadUsdScene(serverUrl, usdScenePath);
}

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/public')));

// Endpoint to start the streaming process
app.post('/startStreaming', async (req, res) => {
  const { prompt, manualMode, sendToA2F } = req.body;

  try {
    let chatGptTTFB = 0;
    let playHTTTFB = 0;
    let chatGptStream;

    if (!manualMode) {
      // Start the TTFB measurement for ChatGPT
      const gptStartTime = Date.now();
      chatGptStream = await streamChatGptText(prompt);
      chatGptTTFB = Date.now() - gptStartTime;
    } else {
      // Manual mode - Directly use prompt as text for TTS
      chatGptStream = Readable.from([prompt]);
    }
    
    // Start the TTFB measurement for PlayHT
    const playHTStartTime = Date.now();
    const { stream: ttsStream } = await convertTextToSpeech(chatGptStream);
    playHTTTFB = Date.now() - playHTStartTime;

    if (sendToA2F) {
      // Stream audio to Audio2Face if the toggle is enabled
      streamAudioToA2F(ttsStream);
      res.json({
        message: 'Audio streaming initiated to Audio2Face',
        chatGptTTFB,
        playHTTTFB
      });
    } else {
      // Pipe TTS audio data directly to the browser if the toggle is disabled
      res.setHeader('Content-Type', 'audio/mpeg');
      // Send TTFB data as custom headers
      res.setHeader('X-ChatGpt-TTFB', chatGptTTFB);
      res.setHeader('X-PlayHT-TTFB', playHTTTFB);
      ttsStream.pipe(res);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
