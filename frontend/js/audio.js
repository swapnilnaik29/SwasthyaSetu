/**
 * SwasthyaSetu Audio Manager
 * Handles microphone capture, recording timer, and single-device echo suppression.
 */

class AudioManager {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
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
      // Stop track immediately
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch (e) {
      console.warn('Microphone permission not granted:', e);
      return false;
    }
  }

  async startRecording() {
    // Single device echo suppression: Stop playback if playing
    if (this.isPlaying) {
      this.stopPlayback();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      // Prefer audio/webm or audio/wav
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = '';
      }

      this.mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100);
      this.isRecording = true;
      this.recordDurationSeconds = 0;

      this._startTimer();
      if (this.onStateChange) this.onStateChange({ isRecording: true, isPlaying: this.isPlaying });
      return true;
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Could not access microphone. Please grant microphone permission in your browser.');
      return false;
    }
  }

  stopRecording() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(null);
        return;
      }

      this._stopTimer();
      this.isRecording = false;

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        
        // Stop stream tracks
        if (this.mediaRecorder.stream) {
          this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }

        if (this.onStateChange) this.onStateChange({ isRecording: false, isPlaying: this.isPlaying });
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  playAudio(url) {
    // If currently recording, stop it to avoid echo feedback
    if (this.isRecording) {
      this.stopRecording();
    }

    if (this.currentAudioPlayer) {
      this.currentAudioPlayer.pause();
      this.currentAudioPlayer = null;
    }

    const player = new Audio(url);
    this.currentAudioPlayer = player;
    this.isPlaying = true;

    if (this.onStateChange) this.onStateChange({ isRecording: this.isRecording, isPlaying: true });

    player.onended = () => {
      this.isPlaying = false;
      this.currentAudioPlayer = null;
      if (this.onStateChange) this.onStateChange({ isRecording: this.isRecording, isPlaying: false });
    };

    player.onerror = (e) => {
      console.error('Playback failed:', e);
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
