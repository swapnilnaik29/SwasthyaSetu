/**
 * SwasthyaSetu Audio Manager
 * Handles microphone capture with native 16kHz Mono 16-bit WAV encoding,
 * recording timer, and single-device echo suppression.
 */

// Helper: Linear interpolation resampling to 16,000 Hz
function resampleTo16k(audioBuffer, originalSampleRate) {
  if (originalSampleRate === 16000) return audioBuffer;
  const ratio = originalSampleRate / 16000;
  const newLength = Math.round(audioBuffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const origIndex = i * ratio;
    const indexFloor = Math.floor(origIndex);
    const indexCeil = Math.min(audioBuffer.length - 1, Math.ceil(origIndex));
    const frac = origIndex - indexFloor;
    result[i] = audioBuffer[indexFloor] * (1 - frac) + audioBuffer[indexCeil] * frac;
  }
  return result;
}

// Helper: Encode 32-bit Float samples into standard 16-bit PCM WAV Blob
function encodeWAV(samples, sampleRate = 16000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /* RIFF chunk descriptor */
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  
  /* "fmt " sub-chunk */
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);      // 16 for PCM
  view.setUint16(20, 1, true);       // PCM format
  view.setUint16(22, 1, true);       // Mono channel
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate (sampleRate * 1 * 16 / 8)
  view.setUint16(32, 2, true);       // Block align (1 * 16 / 8)
  view.setUint16(34, 16, true);      // Bits per sample
  
  /* "data" sub-chunk */
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Write 16-bit PCM samples with clipping protection
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}


class AudioManager {
  constructor() {
    this.audioStream = null;
    this.audioCtx = null;
    this.sourceNode = null;
    this.processorNode = null;
    this.pcmChunks = [];

    this.isRecording = false;
    this.isPlaying = false;
    this.currentAudioPlayer = null;

    this.timerInterval = null;
    this.recordDurationSeconds = 0;

    // Callbacks
    this.onStateChange = null;
    this.onTimerTick = null;
  }

  async checkMicPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch (e) {
      console.warn('Microphone permission not granted:', e);
      return false;
    }
  }

  async startRecording() {
    if (this.isPlaying) {
      this.stopPlayback();
    }

    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.sourceNode = this.audioCtx.createMediaStreamSource(this.audioStream);

      // ScriptProcessor for cross-browser PCM buffer capture (compatible with all mobile and desktop browsers)
      this.processorNode = this.audioCtx.createScriptProcessor(4096, 1, 1);
      this.pcmChunks = [];

      this.processorNode.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        const inputData = e.inputBuffer.getChannelData(0);
        // Copy chunk
        this.pcmChunks.push(new Float32Array(inputData));
      };

      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioCtx.destination);

      this.isRecording = true;
      this.recordDurationSeconds = 0;

      this._startTimer();
      if (this.onStateChange) this.onStateChange({ isRecording: true, isPlaying: this.isPlaying });
      return true;
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Could not access microphone: ' + err.message);
      return false;
    }
  }

  async stopRecording() {
    if (!this.isRecording) return null;
    this._stopTimer();
    this.isRecording = false;

    // Disconnect audio graph
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    const nativeSampleRate = this.audioCtx ? this.audioCtx.sampleRate : 16000;
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try { await this.audioCtx.close(); } catch (_) {}
      this.audioCtx = null;
    }

    if (this.onStateChange) this.onStateChange({ isRecording: false, isPlaying: this.isPlaying });

    // Merge Float32 chunks
    let totalLength = 0;
    for (const chunk of this.pcmChunks) {
      totalLength += chunk.length;
    }
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.pcmChunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    // Resample to 16,000 Hz if hardware ran at 44.1k/48k
    const samples16k = resampleTo16k(merged, nativeSampleRate);
    
    // Encode to real 16-bit PCM WAV Blob
    const wavBlob = encodeWAV(samples16k, 16000);
    return wavBlob;
  }

  playAudio(url) {
    if (this.isRecording) {
      this.stopRecording();
    }

    if (this.currentAudioPlayer) {
      this.currentAudioPlayer.pause();
      this.currentAudioPlayer = null;
    }

    // Timestamp cache buster for audio playback
    const fullUrl = url.includes('?') ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`;
    const player = new Audio(fullUrl);
    this.currentAudioPlayer = player;
    this.isPlaying = true;

    if (this.onStateChange) this.onStateChange({ isRecording: this.isRecording, isPlaying: true });

    player.onended = () => {
      this.isPlaying = false;
      this.currentAudioPlayer = null;
      if (this.onStateChange) this.onStateChange({ isRecording: this.isRecording, isPlaying: false });
    };

    player.onerror = (e) => {
      console.error('Audio playback failed:', e);
      this.isPlaying = false;
      this.currentAudioPlayer = null;
      if (this.onStateChange) this.onStateChange({ isRecording: this.isRecording, isPlaying: false });
    };

    player.play().catch(err => {
      console.warn('Audio auto-play blocked by browser. User interaction needed.', err);
      this.isPlaying = false;
      if (this.onStateChange) this.onStateChange({ isRecording: this.isRecording, isPlaying: false });
    });
  }

  stopPlayback() {
    if (this.currentAudioPlayer) {
      this.currentAudioPlayer.pause();
      this.currentAudioPlayer = null;
    }
    this.isPlaying = false;
    if (this.onStateChange) this.onStateChange({ isRecording: this.isRecording, isPlaying: false });
  }

  _startTimer() {
    this._stopTimer();
    this.timerInterval = setInterval(() => {
      this.recordDurationSeconds++;
      if (this.onTimerTick) {
        const mins = Math.floor(this.recordDurationSeconds / 60).toString().padStart(2, '0');
        const secs = (this.recordDurationSeconds % 60).toString().padStart(2, '0');
        this.onTimerTick(`${mins}:${secs}`);
      }
    }, 1000);
  }

  _stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}

window.audioManager = new AudioManager();
