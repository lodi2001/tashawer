/// Base exception class for app errors
class AppException implements Exception {
  final String message;
  final String? messageAr;
  final int? statusCode;

  AppException({
    required this.message,
    this.messageAr,
    this.statusCode,
  });

  String getLocalizedMessage(String locale) {
    if (locale == 'ar' && messageAr != null) {
      return messageAr!;
    }
    return message;
  }

  @override
  String toString() => message;
}

/// Network connection error
class NetworkException extends AppException {
  NetworkException({
    required super.message,
    super.messageAr,
  });
}

/// Server-side error (5xx)
class ServerException extends AppException {
  ServerException({
    required super.message,
    super.messageAr,
    super.statusCode,
  });
}

/// Authentication error (401, 403)
class AuthException extends AppException {
  AuthException({
    required super.message,
    super.messageAr,
  }) : super(statusCode: 401);
}

/// Resource not found (404)
class NotFoundException extends AppException {
  NotFoundException({
    required super.message,
    super.messageAr,
  }) : super(statusCode: 404);
}

/// Validation error (400, 422)
class ValidationException extends AppException {
  final Map<String, dynamic>? errors;

  ValidationException({
    required super.message,
    super.messageAr,
    this.errors,
  }) : super(statusCode: 422);

  String? getFieldError(String field) {
    if (errors == null) return null;
    final fieldErrors = errors![field];
    if (fieldErrors is List && fieldErrors.isNotEmpty) {
      return fieldErrors.first.toString();
    }
    if (fieldErrors is String) {
      return fieldErrors;
    }
    return null;
  }
}

/// Rate limit exceeded (429)
class RateLimitException extends AppException {
  RateLimitException({
    required super.message,
    super.messageAr,
  }) : super(statusCode: 429);
}

/// Cache error
class CacheException extends AppException {
  CacheException({
    required super.message,
    super.messageAr,
  });
}
