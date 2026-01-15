/// Application-wide constants
class AppConstants {
  AppConstants._();

  // API Configuration
  static const String baseUrl = 'https://api.tashawer.com/api/v1';
  static const String devBaseUrl = 'http://10.0.2.2:8000/api/v1';

  // Timeouts
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // Pagination
  static const int defaultPageSize = 20;

  // Cache Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userDataKey = 'user_data';
  static const String languageKey = 'language';
  static const String themeKey = 'theme';

  // WebSocket
  static const String wsBaseUrl = 'wss://api.tashawer.com/ws';
  static const String wsDevBaseUrl = 'ws://10.0.2.2:8000/ws';
}
