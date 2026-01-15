import 'package:flutter/material.dart';
import '../core/constants/colors.dart';

/// Tashawer app theme configuration
class TashawerTheme {
  TashawerTheme._();

  static const String fontFamily = 'IBMPlexSansArabic';

  // Light Theme
  static ThemeData get light => ThemeData(
        useMaterial3: true,
        fontFamily: fontFamily,
        brightness: Brightness.light,
        colorScheme: const ColorScheme.light(
          primary: TashawerColors.primary,
          onPrimary: TashawerColors.textOnPrimary,
          primaryContainer: TashawerColors.primaryBg,
          secondary: TashawerColors.secondary,
          onSecondary: TashawerColors.textOnSecondary,
          secondaryContainer: TashawerColors.secondaryBg,
          tertiary: TashawerColors.accent,
          surface: TashawerColors.surface,
          onSurface: TashawerColors.textPrimary,
          surfaceContainerHighest: TashawerColors.surfaceVariant,
          error: TashawerColors.error,
          onError: Colors.white,
          errorContainer: TashawerColors.errorBg,
          outline: TashawerColors.border,
          outlineVariant: TashawerColors.borderLight,
        ),
        scaffoldBackgroundColor: TashawerColors.background,
        dividerColor: TashawerColors.divider,
        appBarTheme: const AppBarTheme(
          backgroundColor: TashawerColors.surface,
          foregroundColor: TashawerColors.textPrimary,
          elevation: 0,
          centerTitle: true,
          titleTextStyle: TextStyle(
            fontFamily: fontFamily,
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: TashawerColors.textPrimary,
          ),
        ),
        cardTheme: CardTheme(
          color: TashawerColors.surface,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: TashawerColors.border),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: TashawerColors.surface,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 14,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: TashawerColors.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: TashawerColors.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(
              color: TashawerColors.primary,
              width: 2,
            ),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: TashawerColors.error),
          ),
          hintStyle: const TextStyle(
            color: TashawerColors.textTertiary,
            fontSize: 14,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: TashawerColors.primary,
            foregroundColor: TashawerColors.textOnPrimary,
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
            textStyle: const TextStyle(
              fontFamily: fontFamily,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: TashawerColors.primary,
            side: const BorderSide(color: TashawerColors.primary),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
            textStyle: const TextStyle(
              fontFamily: fontFamily,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: TashawerColors.primary,
            textStyle: const TextStyle(
              fontFamily: fontFamily,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        chipTheme: ChipThemeData(
          backgroundColor: TashawerColors.surfaceVariant,
          selectedColor: TashawerColors.primaryBg,
          labelStyle: const TextStyle(
            fontFamily: fontFamily,
            fontSize: 14,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: TashawerColors.surface,
          selectedItemColor: TashawerColors.primary,
          unselectedItemColor: TashawerColors.textTertiary,
          type: BottomNavigationBarType.fixed,
          elevation: 8,
        ),
        floatingActionButtonTheme: const FloatingActionButtonThemeData(
          backgroundColor: TashawerColors.primary,
          foregroundColor: TashawerColors.textOnPrimary,
          elevation: 4,
        ),
        tabBarTheme: const TabBarTheme(
          labelColor: TashawerColors.primary,
          unselectedLabelColor: TashawerColors.textSecondary,
          indicatorColor: TashawerColors.primary,
        ),
        dialogTheme: DialogTheme(
          backgroundColor: TashawerColors.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        snackBarTheme: SnackBarThemeData(
          backgroundColor: TashawerColors.textPrimary,
          contentTextStyle: const TextStyle(
            fontFamily: fontFamily,
            color: TashawerColors.textOnPrimary,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );

  // Dark Theme
  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        fontFamily: fontFamily,
        brightness: Brightness.dark,
        colorScheme: const ColorScheme.dark(
          primary: TashawerColors.primaryLight,
          onPrimary: TashawerColors.textOnPrimary,
          primaryContainer: TashawerColors.primaryDark,
          secondary: TashawerColors.secondaryLight,
          onSecondary: TashawerColors.textOnSecondary,
          tertiary: TashawerColors.accentLight,
          surface: TashawerColors.darkSurface,
          onSurface: TashawerColors.darkTextPrimary,
          surfaceContainerHighest: TashawerColors.darkSurfaceVariant,
          error: TashawerColors.errorLight,
          onError: Colors.white,
          outline: TashawerColors.darkBorder,
        ),
        scaffoldBackgroundColor: TashawerColors.darkBackground,
        dividerColor: TashawerColors.darkBorder,
        appBarTheme: const AppBarTheme(
          backgroundColor: TashawerColors.darkSurface,
          foregroundColor: TashawerColors.darkTextPrimary,
          elevation: 0,
          centerTitle: true,
          titleTextStyle: TextStyle(
            fontFamily: fontFamily,
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: TashawerColors.darkTextPrimary,
          ),
        ),
        cardTheme: CardTheme(
          color: TashawerColors.darkSurface,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: TashawerColors.darkBorder),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: TashawerColors.darkSurfaceVariant,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 14,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: TashawerColors.darkBorder),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: TashawerColors.darkBorder),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(
              color: TashawerColors.primaryLight,
              width: 2,
            ),
          ),
          hintStyle: const TextStyle(
            color: TashawerColors.darkTextSecondary,
            fontSize: 14,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: TashawerColors.primaryLight,
            foregroundColor: TashawerColors.textOnPrimary,
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: TashawerColors.darkSurface,
          selectedItemColor: TashawerColors.primaryLight,
          unselectedItemColor: TashawerColors.darkTextSecondary,
          type: BottomNavigationBarType.fixed,
        ),
      );
}
