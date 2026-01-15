import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/storage_service.dart';

/// Auth state for tracking authentication status
class AuthState extends ChangeNotifier {
  bool _isAuthenticated = false;
  bool _isLoading = true;
  Map<String, dynamic>? _user;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  Map<String, dynamic>? get user => _user;

  String? get userId => _user?['id']?.toString();
  String? get email => _user?['email'];
  String? get fullName => _user?['full_name'];
  String? get userType => _user?['user_type'];
  bool get isClient => userType == 'client';
  bool get isConsultant => userType == 'consultant';

  void setAuthenticated(bool value, {Map<String, dynamic>? user}) {
    _isAuthenticated = value;
    _user = user;
    _isLoading = false;
    notifyListeners();
  }

  void setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void logout() {
    _isAuthenticated = false;
    _user = null;
    notifyListeners();
  }
}

/// Provider for auth state
final authStateProvider = ChangeNotifierProvider<AuthState>((ref) {
  return AuthState();
});

/// Provider for storage service
final storageServiceProvider = Provider<StorageService>((ref) {
  throw UnimplementedError('StorageService must be overridden');
});

/// Provider for checking initial auth state
final authInitProvider = FutureProvider<bool>((ref) async {
  final storage = ref.read(storageServiceProvider);
  final authState = ref.read(authStateProvider);

  try {
    final hasToken = await storage.hasValidToken();
    if (hasToken) {
      final userData = await storage.getUserData();
      authState.setAuthenticated(true, user: userData);
      return true;
    }
    authState.setAuthenticated(false);
    return false;
  } catch (e) {
    authState.setAuthenticated(false);
    return false;
  }
});
