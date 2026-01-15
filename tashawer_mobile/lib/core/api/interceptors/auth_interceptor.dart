import 'package:dio/dio.dart';
import '../../constants/app_constants.dart';
import '../../services/storage_service.dart';

/// Interceptor for handling authentication tokens
class AuthInterceptor extends Interceptor {
  final StorageService _storageService;
  final Dio _dio;
  bool _isRefreshing = false;

  AuthInterceptor({
    required StorageService storageService,
    required Dio dio,
  })  : _storageService = storageService,
        _dio = dio;

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Skip auth header for auth endpoints
    if (_isAuthEndpoint(options.path)) {
      return handler.next(options);
    }

    final accessToken = await _storageService.getAccessToken();
    if (accessToken != null) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }

    return handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401 && !_isRefreshing) {
      _isRefreshing = true;

      try {
        final refreshToken = await _storageService.getRefreshToken();
        if (refreshToken == null) {
          await _storageService.clearTokens();
          return handler.next(err);
        }

        // Try to refresh the token
        final response = await _dio.post(
          '/accounts/token/refresh/',
          data: {'refresh': refreshToken},
          options: Options(
            headers: {'Authorization': null},
          ),
        );

        if (response.statusCode == 200) {
          final newAccessToken = response.data['access'];
          final newRefreshToken = response.data['refresh'];

          await _storageService.saveTokens(
            accessToken: newAccessToken,
            refreshToken: newRefreshToken ?? refreshToken,
          );

          // Retry the original request
          final options = err.requestOptions;
          options.headers['Authorization'] = 'Bearer $newAccessToken';

          final retryResponse = await _dio.fetch(options);
          return handler.resolve(retryResponse);
        }
      } catch (e) {
        await _storageService.clearTokens();
      } finally {
        _isRefreshing = false;
      }
    }

    return handler.next(err);
  }

  bool _isAuthEndpoint(String path) {
    final authEndpoints = [
      '/accounts/login/',
      '/accounts/register/',
      '/accounts/token/refresh/',
      '/accounts/password/reset/',
      '/accounts/verify-otp/',
    ];
    return authEndpoints.any((endpoint) => path.contains(endpoint));
  }
}
