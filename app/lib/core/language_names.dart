class LanguageNames {
  static const Map<String, String> _names = {
    'mr-IN': 'Marathi',
    'mr': 'Marathi',
    'hi-IN': 'Hindi',
    'hi': 'Hindi',
    'en-IN': 'English',
    'en': 'English',
    'gu-IN': 'Gujarati',
    'gu': 'Gujarati',
    'bn-IN': 'Bengali',
    'bn': 'Bengali',
    'te-IN': 'Telugu',
    'te': 'Telugu',
    'ta-IN': 'Tamil',
    'ta': 'Tamil',
    'kn-IN': 'Kannada',
    'kn': 'Kannada',
    'ml-IN': 'Malayalam',
    'ml': 'Malayalam',
    'pa-IN': 'Punjabi',
    'pa': 'Punjabi',
    'or-IN': 'Odia',
    'or': 'Odia',
  };

  static String getName(String? code) {
    if (code == null || code.trim().isEmpty) return 'English';
    final clean = code.trim();
    if (_names.containsKey(clean)) return _names[clean]!;
    final prefix = clean.split('-')[0].toLowerCase();
    if (_names.containsKey(prefix)) return _names[prefix]!;
    return clean;
  }
}

