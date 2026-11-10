import 'package:flutter/material.dart';
import '../core/i18n_service.dart';
import '../core/theme.dart';

class LanguageSelectorSheet extends StatelessWidget {
  const LanguageSelectorSheet({super.key});

  static const List<Map<String, String>> languages = [
    {'code': 'en-IN', 'name': 'English', 'native': 'Indian English'},
    {'code': 'mr-IN', 'name': 'Marathi', 'native': 'मराठी'},
    {'code': 'hi-IN', 'name': 'Hindi', 'native': 'हिन्दी'},
    {'code': 'gu-IN', 'name': 'Gujarati', 'native': 'ગુજરાતી'},
  ];

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => const LanguageSelectorSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final i18n = I18nService();
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Row(
            children: [
              Icon(Icons.language, color: AppColors.primaryGreen, size: 24),
              SizedBox(width: 10),
              Text(
                'Switch Portal Language',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textMain,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Synchronized with clinic database localization cache',
            style: TextStyle(fontSize: 13, color: AppColors.textMuted),
          ),
          const SizedBox(height: 16),
          ...languages.map((lang) {
            final isSelected = i18n.currentLanguage == lang['code'];
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.greenLight : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isSelected ? AppColors.primaryGreen : AppColors.border,
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: ListTile(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                title: Text(
                  lang['name']!,
                  style: TextStyle(
                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                    color: isSelected ? AppColors.primaryGreenDeep : AppColors.textMain,
                  ),
                ),
                subtitle: Text(
                  lang['native']!,
                  style: TextStyle(
                    color: isSelected ? AppColors.primaryGreen : AppColors.textMuted,
                    fontSize: 12,
                  ),
                ),
                trailing: isSelected
                    ? const Icon(Icons.check_circle, color: AppColors.primaryGreen)
                    : null,
                onTap: () {
                  i18n.setLanguage(lang['code']!);
                  Navigator.pop(context);
                },
              ),
            );
          }),
        ],
      ),
    );
  }
}

