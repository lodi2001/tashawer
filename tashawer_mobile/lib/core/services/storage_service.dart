import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../constants/app_constants.dart';

/// Service for secure storage of sensitive data and general app data
class StorageService {
  late final FlutterSecureStorage _secureStorage;
  late final Box _settingsBox;

  StorageService._();

  static Future<StorageService> init() async {
    final service = StorageService._();
    await service._initialize();
    return service;
  }

  Future<void> _initialize() async {
    // Initialize secure storage for tokens
    _secureStorage = const FlutterSecureStorage(
      aOptions: AndroidOptions(
        encryptedSharedPreferences: true,
      ),
      iOptions: IOSOptions(
        accessibility: KeychainAccessibility.first_unlock,
      ),
    );

    // Initialize Hive for general settings
    await Hive.initFlutter();
    _settingsBox = await Hive.openBox('settings');
  }

  // Token Management
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _secureStorage.write(
        key: AppConstants.accessTokenKey,
        value: accessToken,
      ),
      _secureStorage.write(
        key: AppConstants.refreshTokenKey,
        value: refreshToken,
      ),
    ]);
  }

  Future<String?> getAccessToken() async {
    return _secureStorage.read(key: AppConstants.accessTokenKey);
  }

  Future<String?> getRefreshToken() async {
    return _secureStorage.read(key: AppConstants.refreshTokenKey);
  }

  Future<void> clearTokens() async {
    await Future.wait([
      _secureStorage.delete(key: AppConstants.accessTokenKey),
      _secureStorage.delete(key: AppConstants.refreshTokenKey),
    ]);
  }

  Future<bool> hasValidToken() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }

  // User Data
  Future<void> saveUserData(Map<String, dynamic> userData) async {
    await _secureStorage.write(
      key: AppConstants.userDataKey,
      value: jsonEncode(userData),
    );
  }

  Future<Map<String, dynamic>?> getUserData() async {
    final data = await _secureStorage.read(key: AppConstants.userDataKey);
    if (data == null) return null;
    return jsonDecode(data) as Map<String, dynamic>;
  }

  Future<void> clearUserData() async {
    await _secureStorage.delete(key: AppConstants.userDataKey);
  }

  // Settings (Language, Theme, etc.)
  Future<void> setLanguage(String languageCode) async {
    await _settingsBox.put(AppConstants.languageKey, languageCode);
  }

  String getLanguage() {
    return _settingsBox.get(AppConstants.languageKey, defaultValue: 'ar');
  }

  Future<void> setThemeMode(String mode) async {
    await _settingsBox.put(AppConstants.themeKey, mode);
  }

  String getThemeMode() {
    return _settingsBox.get(AppConstants.themeKey, defaultValue: 'system');
  }

  // General key-value storage
  Future<void> setValue(String key, dynamic value) async {
    await _settingsBox.put(key, value);
  }

  T? getValue<T>(String key, {T? defaultValue}) {
    return _settingsBox.get(key, defaultValue: defaultValue) as T?;
  }

  Future<void> removeValue(String key) async {
    await _settingsBox.delete(key);
  }

  // Clear all data (logout)
  Future<void> clearAll() async {
    await Future.wait([
      clearTokens(),
      clearUserData(),
      _settingsBox.clear(),
    ]);
  }
}
