// Import required modules and classes
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { Transform } from 'stream';

// Configuration constants
const PROTO_PATH = "C:/Users/houar/AppData/Local/ov/pkg/audio2face-2023.1.1/exts/omni.audio2face.player/omni/audio2face/player/scripts/streaming_server/proto/audio2face.proto";
const A2F_INSTANCE_NAME = '/World/audio2face/PlayerStreaming';
const A2F_SERVER_ADDRESS = 'localhost:50051';
const audioBitrate = 24000;

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Load gRPC proto file for audio2face
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const audio2faceProto = grpc.loadPackageDefinition(packageDefinition).nvidia.audio2face;

// gRPC client for audio2face
const client = new audio2faceProto.Audio2Face(A2F_SERVER_ADDRESS, grpc.credentials.createInsecure());

// Transform stream to convert audio buffer to float32 array
class AudioBufferToFloat32Transform extends Transform {
  _transform(chunk, encoding, callback) {
    const int16Array = new Int16Array(chunk.buffer, chunk.byteOffset, chunk.length / Int16Array.BYTES_PER_ELEMENT);
    const float32Array = new Float32Array(int16Array.length);
    int16Array.forEach((int16, i) => {
      float32Array[i] = int16 / 32768.0;
    });
    this.push(Buffer.from(float32Array.buffer));
    callback();
  }
}

// Function to stream audio to Audio2Face
export async function streamAudioToA2F(ttsStream) {
  // Create an instance of AudioBufferToFloat32Transform
  const audioTransform = new AudioBufferToFloat32Transform();
    
  // Setup the gRPC call for streaming audio
  const call = client.PushAudioStream((error) => {
    if (error) {
      console.error('Error during PushAudioStream:', error);
    }
  });

  // Handle data events for the audio transform
  audioTransform.on('data', (float32Buffer) => {
    call.write({ audio_data: float32Buffer });
  });

  // Handle the end of the audio transform stream
  audioTransform.on('end', () => {
    call.end();
  });

  // Write start marker to the gRPC call
  call.write({
    start_marker: {
      instance_name: A2F_INSTANCE_NAME,
      samplerate: audioBitrate,
      block_until_playback_is_finished: true
    }
  });

  // Configure FFmpeg and start processing the TTS stream
  ffmpeg(ttsStream)
    .inputFormat('mp3')
    .audioFrequency(audioBitrate)
    .audioChannels(1)
    .format('s16le')
    .pipe(audioTransform, { end: true });
}