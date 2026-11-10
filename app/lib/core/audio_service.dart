import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

class AudioService extends ChangeNotifier {
  static final AudioService _instance = AudioService._internal();
  factory AudioService() => _instance;
  AudioService._internal();

  final AudioRecorder _recorder = AudioRecorder();
  final AudioPlayer _player = AudioPlayer();

  bool _isRecording = false;
  bool _isPlaying = false;
  int _recordDurationSeconds = 0;
  Timer? _recordTimer;
  String? _currentRecordingPath;

  bool get isRecording => _isRecording;
  bool get isPlaying => _isPlaying;
  int get recordDurationSeconds => _recordDurationSeconds;

  String get formattedTimer {
    final minutes = (_recordDurationSeconds ~/ 60).toString().padLeft(2, '0');
    final seconds = (_recordDurationSeconds % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  void init() {
    _player.onPlayerStateChanged.listen((state) {
      final playing = state == PlayerState.playing;
      if (_isPlaying != playing) {
        _isPlaying = playing;
        notifyListeners();
      }
    });
  }

  Future<bool> startRecording() async {
    // If playing, stop playback first
    if (_isPlaying) {
      await stopAudio();
    }

    try {
      final hasPermission = await _recorder.hasPermission();
      if (!hasPermission) {
        debugPrint('[AudioService] Microphone permission not granted');
        return false;
      }

      final tempDir = await getTemporaryDirectory();
      final path = '${tempDir.path}/rec_${DateTime.now().millisecondsSinceEpoch}.wav';
      _currentRecordingPath = path;

      await _recorder.start(
        const RecordConfig(
          encoder: AudioEncoder.wav,
          sampleRate: 16000,
          numChannels: 1,
        ),
        path: path,
      );

      _isRecording = true;
      _recordDurationSeconds = 0;
      _recordTimer?.cancel();
      _recordTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        _recordDurationSeconds++;
        notifyListeners();
      });

      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('[AudioService] Start recording failed: $e');
      _isRecording = false;
      notifyListeners();
      return false;
    }
  }

  Future<List<int>?> stopRecording() async {
    if (!_isRecording) return null;

    _recordTimer?.cancel();
    _recordTimer = null;
    _isRecording = false;
    notifyListeners();

    try {
      final path = await _recorder.stop();
      final actualPath = path ?? _currentRecordingPath;
      if (actualPath != null) {
        final file = File(actualPath);
        if (await file.exists()) {
          final bytes = await file.readAsBytes();
          return bytes;
        }
      }
    } catch (e) {
      debugPrint('[AudioService] Stop recording failed: $e');
    }
    return null;
  }

  Future<void> playAudio(String url) async {
    // Stop recording if recording
    if (_isRecording) {
      await stopRecording();
    }

    try {
      await _player.stop();
      _isPlaying = true;
      notifyListeners();
      await _player.play(UrlSource(url));
    } catch (e) {
      debugPrint('[AudioService] Playback failed: $e');
      _isPlaying = false;
      notifyListeners();
    }
  }

  Future<void> stopAudio() async {
    try {
      await _player.stop();
      _isPlaying = false;
      notifyListeners();
    } catch (e) {
      debugPrint('[AudioService] Stop audio failed: $e');
    }
  }

  @override
  void dispose() {
    _recordTimer?.cancel();
    _recorder.dispose();
    _player.dispose();
    super.dispose();
  }
}

