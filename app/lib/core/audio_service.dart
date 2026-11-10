import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
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
    _player.onPlayerComplete.listen((_) {
      _isPlaying = false;
      notifyListeners();
    });
    _setupAudioContext();
  }

  Future<void> _setupAudioContext() async {
    try {
      await _player.setAudioContext(AudioContext(
        android: const AudioContextAndroid(
          isSpeakerphoneOn: true,
          stayAwake: true,
          contentType: AndroidContentType.speech,
          usageType: AndroidUsageType.media,
          audioFocus: AndroidAudioFocus.gainTransient,
        ),
        iOS: AudioContextIOS(
          category: AVAudioSessionCategory.playAndRecord,
          options: const {
            AVAudioSessionOptions.defaultToSpeaker,
          },
        ),
      ));
      await _player.setVolume(1.0);
    } catch (e) {
      debugPrint('[AudioService] Failed to set audio context: $e');
    }
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
        // Ensure Android MediaRecorder finishes flushing to disk
        await Future.delayed(const Duration(milliseconds: 150));
        final file = File(actualPath);
        if (await file.exists()) {
          final bytes = await file.readAsBytes();
          if (bytes.isNotEmpty) {
            _currentRecordingPath = null;
            debugPrint('[AudioService] Recording stopped. Read ${bytes.length} bytes.');
            return bytes;
          }
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
      await _setupAudioContext();
      await _player.stop();
      _isPlaying = true;
      notifyListeners();

      debugPrint('[AudioService] Downloading audio file: $url');
      final uri = Uri.parse(url);
      final response = await http.get(uri).timeout(const Duration(seconds: 15));
      if (response.statusCode != 200 || response.bodyBytes.isEmpty) {
        throw Exception('Failed to fetch audio: status ${response.statusCode}');
      }

      final tempDir = await getTemporaryDirectory();
      final tempFile = File('${tempDir.path}/tts_${DateTime.now().millisecondsSinceEpoch}.wav');
      await tempFile.writeAsBytes(response.bodyBytes, flush: true);

      debugPrint('[AudioService] Playing audio via DeviceFileSource: ${tempFile.path} (${response.bodyBytes.length} bytes)');
      await _player.play(DeviceFileSource(tempFile.path));
    } catch (e) {
      debugPrint('[AudioService] Playback failed: $e');
      _isPlaying = false;
      notifyListeners();
    }
  }

  Future<void> playAudioAndWait(String url) async {
    await playAudio(url);
    if (!_isPlaying) return;

    final completer = Completer<void>();
    StreamSubscription? sub;
    sub = _player.onPlayerComplete.listen((_) {
      sub?.cancel();
      if (!completer.isCompleted) completer.complete();
    });
    // Fallback safety timeout (12s)
    Future.delayed(const Duration(seconds: 12), () {
      sub?.cancel();
      if (!completer.isCompleted) completer.complete();
    });
    await completer.future;
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
