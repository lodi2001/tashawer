import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'theme.dart';
import 'routes.dart';
import '../core/services/storage_service.dart';
import '../shared/providers/auth_provider.dart';
import '../l10n/app_localizations.dart';

/// Main app widget
class TashawerApp extends ConsumerStatefulWidget {
  const TashawerApp({super.key});

  @override
  ConsumerState<TashawerApp> createState() => _TashawerAppState();
}

class _TashawerAppState extends ConsumerState<TashawerApp> {
  late Locale _locale;
  late ThemeMode _themeMode;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  void _loadSettings() {
    final storage = ref.read(storageServiceProvider);
    final languageCode = storage.getLanguage();
    final themeModeStr = storage.getThemeMode();

    _locale = Locale(languageCode);
    _themeMode = _parseThemeMode(themeModeStr);
  }

  ThemeMode _parseThemeMode(String mode) {
    switch (mode) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      default:
        return ThemeMode.system;
    }
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Tashawer',
      debugShowCheckedModeBanner: false,

      // Theme
      theme: TashawerTheme.light,
      darkTheme: TashawerTheme.dark,
      themeMode: _themeMode,

      // Localization
      locale: _locale,
      supportedLocales: const [
        Locale('ar'),
        Locale('en'),
      ],
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],

      // Routing
      routerConfig: router,

      // Builder for RTL support and global error handling
      builder: (context, child) {
        return Directionality(
          textDirection: _locale.languageCode == 'ar'
              ? TextDirection.rtl
              : TextDirection.ltr,
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
