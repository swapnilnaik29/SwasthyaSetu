class NameLocalizer {
  static final Map<String, String> _devanagariMap = {
    'ramesh kumar': 'रमेश कुमार',
    'sunita patil': 'सुनीता पाटील',
    'vikram singh': 'विक्रम सिंह',
    'anita sharma': 'अनिता शर्मा',
    'rahul sharma': 'राहुल शर्मा',
    'priya sharma': 'प्रिया शर्मा',
    'dr. priya sharma': 'डॉ. प्रिया शर्मा',
    'swapnil naik': 'स्वप्नील नाईक',
    'dr. swapnil naik': 'डॉ. स्वप्नील नाईक',
    'sanjay pawar': 'संजय पवार',
    'amol jadhav': 'अमोल जाधव',
    'pooja deshmukh': 'पूजा देशमुख',
    'kavita shinde': 'कविता शिंदे',
    'deepak verma': 'दीपक वर्मा',
    'rajesh gupta': 'राजेश गुप्ता',
    'manoj joshi': 'मनोज जोशी',
    'aarav patel': 'आरव पटेल',
    'amit shah': 'अमित शाह',
    'ganesh shinde': 'गणेश शिंदे',
    'prashant kulkarni': 'प्रशांत कुलकर्णी',
    'rohit sharma': 'रोहित शर्मा',
    'anand patil': 'आनंद पाटील',
    'suresh bhat': 'सुरेश भट',
    'mahesh kale': 'महेश काळे',
  };

  /// Returns the name localized according to the doctor's preferred language.
  /// Database records always retain canonical English.
  static String localize(String englishName, String doctorLanguage) {
    if (englishName.trim().isEmpty) return englishName;

    // If doctor prefers English, always show canonical English
    if (doctorLanguage == 'en-IN' || doctorLanguage == 'en') {
      return englishName;
    }

    // If already in Devanagari, return as-is
    if (englishName.runes.any((r) => r >= 0x0900 && r <= 0x097F)) {
      return englishName;
    }

    // Check fast pre-cached Devanagari dictionary
    final key = englishName.trim().toLowerCase();
    if (_devanagariMap.containsKey(key)) {
      return _devanagariMap[key]!;
    }

    // Approximate phonetic transliteration for unlisted Indian names to Devanagari
    return _simpleTransliterateToDevanagari(englishName);
  }

  static String _simpleTransliterateToDevanagari(String text) {
    // Basic fallback transliterator for Indian names
    final Map<String, String> charMap = {
      'sh': 'श',
      'ch': 'च',
      'th': 'थ',
      'ph': 'फ',
      'dh': 'ध',
      'bh': 'भ',
      'kh': 'ख',
      'gh': 'घ',
      'jh': 'झ',
      'ee': 'ी',
      'oo': 'ू',
      'ai': 'ै',
      'au': 'ौ',
      'k': 'क',
      'g': 'ग',
      'c': 'क',
      'j': 'ज',
      't': 'त',
      'd': 'द',
      'n': 'न',
      'p': 'प',
      'b': 'ब',
      'm': 'म',
      'y': 'य',
      'r': 'र',
      'l': 'ल',
      'v': 'व',
      'w': 'व',
      's': 'स',
      'h': 'ह',
      'a': 'ा',
      'i': 'ि',
      'u': 'ु',
      'e': 'े',
      'o': 'ो',
    };

    String lower = text.toLowerCase();
    String result = '';
    int i = 0;
    while (i < lower.length) {
      if (i + 1 < lower.length && charMap.containsKey(lower.substring(i, i + 2))) {
        result += charMap[lower.substring(i, i + 2)]!;
        i += 2;
      } else if (charMap.containsKey(lower[i])) {
        result += charMap[lower[i]]!;
        i += 1;
      } else {
        result += lower[i];
        i += 1;
      }
    }
    return result.isNotEmpty ? result : text;
  }
}

