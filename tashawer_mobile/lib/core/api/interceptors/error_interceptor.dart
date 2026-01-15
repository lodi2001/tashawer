import 'package:dio/dio.dart';
import '../../utils/exceptions.dart';

/// Interceptor for handling API errors
class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final exception = _handleError(err);
    handler.next(
      DioException(
        requestOptions: err.requestOptions,
        error: exception,
        response: err.response,
        type: err.type,
      ),
    );
  }

  AppException _handleError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return NetworkException(
          message: 'Connection timed out. Please check your internet connection.',
          messageAr: 'انتهت مهلة الاتصال. يرجى التحقق من اتصالك بالإنترنت.',
        );

      case DioExceptionType.connectionError:
        return NetworkException(
          message: 'No internet connection. Please check your network.',
          messageAr: 'لا يوجد اتصال بالإنترنت. يرجى التحقق من شبكتك.',
        );

      case DioExceptionType.badResponse:
        return _handleHttpError(error.response);

      case DioExceptionType.cancel:
        return AppException(
          message: 'Request was cancelled.',
          messageAr: 'تم إلغاء الطلب.',
        );

      default:
        return AppException(
          message: 'An unexpected error occurred.',
          messageAr: 'حدث خطأ غير متوقع.',
        );
    }
  }

  AppException _handleHttpError(Response? response) {
    if (response == null) {
      return ServerException(
        message: 'Server error. Please try again later.',
        messageAr: 'خطأ في الخادم. يرجى المحاولة لاحقًا.',
      );
    }

    final statusCode = response.statusCode ?? 0;
    final data = response.data;

    // Try to extract error message from response
    String? serverMessage;
    String? serverMessageAr;

    if (data is Map) {
      serverMessage = data['message'] ??
                      data['error'] ??
                      data['detail'] ??
                      (data['non_field_errors'] as List?)?.first;
      serverMessageAr = data['message_ar'] ?? data['detail_ar'];
    }

    switch (statusCode) {
      case 400:
        return ValidationException(
          message: serverMessage ?? 'Invalid request. Please check your input.',
          messageAr: serverMessageAr ?? 'طلب غير صالح. يرجى التحقق من المدخلات.',
          errors: data is Map ? data['errors'] : null,
        );

      case 401:
        return AuthException(
          message: serverMessage ?? 'Authentication required. Please log in.',
          messageAr: serverMessageAr ?? 'مطلوب تسجيل الدخول.',
        );

      case 403:
        return AuthException(
          message: serverMessage ?? 'You do not have permission to perform this action.',
          messageAr: serverMessageAr ?? 'ليس لديك صلاحية للقيام بهذا الإجراء.',
        );

      case 404:
        return NotFoundException(
          message: serverMessage ?? 'The requested resource was not found.',
          messageAr: serverMessageAr ?? 'المورد المطلوب غير موجود.',
        );

      case 422:
        return ValidationException(
          message: serverMessage ?? 'Validation failed. Please check your input.',
          messageAr: serverMessageAr ?? 'فشل التحقق. يرجى التحقق من المدخلات.',
          errors: data is Map ? data['errors'] : null,
        );

      case 429:
        return RateLimitException(
          message: serverMessage ?? 'Too many requests. Please try again later.',
          messageAr: serverMessageAr ?? 'طلبات كثيرة جداً. يرجى المحاولة لاحقاً.',
        );

      case 500:
      case 502:
      case 503:
      case 504:
        return ServerException(
          message: serverMessage ?? 'Server error. Please try again later.',
          messageAr: serverMessageAr ?? 'خطأ في الخادم. يرجى المحاولة لاحقاً.',
        );

      default:
        return AppException(
          message: serverMessage ?? 'An error occurred. Please try again.',
          messageAr: serverMessageAr ?? 'حدث خطأ. يرجى المحاولة مرة أخرى.',
          statusCode: statusCode,
        );
    }
  }
}
