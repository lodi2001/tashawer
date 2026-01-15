import 'package:flutter/material.dart';

/// App localizations delegate
class AppLocalizations {
  final Locale locale;

  AppLocalizations(this.locale);

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static final Map<String, Map<String, String>> _localizedValues = {
    'en': {
      // General
      'app_name': 'Tashawer',
      'loading': 'Loading...',
      'error': 'Error',
      'success': 'Success',
      'cancel': 'Cancel',
      'confirm': 'Confirm',
      'save': 'Save',
      'delete': 'Delete',
      'edit': 'Edit',
      'close': 'Close',
      'search': 'Search',
      'no_data': 'No data available',
      'try_again': 'Try again',
      'view_all': 'View All',
      'all': 'All',
      'read_more': 'Read more',
      'view_details': 'View Details',

      // Auth
      'login': 'Login',
      'register': 'Register',
      'logout': 'Logout',
      'email': 'Email',
      'password': 'Password',
      'confirm_password': 'Confirm Password',
      'forgot_password': 'Forgot Password?',
      'full_name': 'Full Name',
      'phone': 'Phone Number',
      'welcome_back': 'Welcome Back',
      'create_account': 'Create Account',
      'already_have_account': 'Already have an account?',
      'dont_have_account': 'Don\'t have an account?',
      'login_success': 'Login successful',
      'register_success': 'Registration successful',

      // Navigation
      'projects': 'Projects',
      'messages': 'Messages',
      'orders': 'Orders',
      'notifications': 'Notifications',
      'alerts': 'Alerts',
      'profile': 'Profile',
      'proposals': 'Proposals',

      // Projects
      'open_projects': 'Open Projects',
      'my_projects': 'My Projects',
      'create_project': 'Create Project',
      'project_details': 'Project Details',
      'project_title': 'Project Title',
      'project_description': 'Project Description',
      'budget': 'Budget',
      'deadline': 'Deadline',
      'category': 'Category',
      'skills_required': 'Skills Required',
      'submit_proposal': 'Submit Proposal',
      'no_projects': 'No projects found',
      'fixed_price': 'Fixed Price',
      'posted': 'Posted',
      'apply_now': 'Apply Now',
      'save_project': 'Save Project',

      // Proposals
      'my_proposals': 'My Proposals',
      'proposal_details': 'Proposal Details',
      'cover_letter': 'Cover Letter',
      'proposed_budget': 'Proposed Budget',
      'delivery_time': 'Delivery Time',
      'days': 'days',
      'accept': 'Accept',
      'reject': 'Reject',
      'invites': 'Invites',
      'discussing': 'Discussing',
      'submitted': 'Submitted',
      'active': 'Active',
      'archived': 'Archived',
      'drafts': 'Drafts',
      'filter_proposals': 'Filter Proposals',
      'sort_by_date': 'Sort by Date',
      'sort_by_budget': 'Sort by Budget',
      'proposal_submitted': 'Your proposal was submitted',
      'proposal_submitted_desc': 'Edit any detail for up to 6 hours, or until your proposal is viewed.',
      'job_details': 'Job details',
      'what_we_need': 'What We Need',
      'your_proposed_terms': 'Your proposed terms',
      'edit_proposal': 'Edit Proposal',
      'edit_proposal_info': 'Edit any detail for up to 6 hours, or until your proposal is viewed.',
      'withdraw': 'Withdraw',
      'withdraw_proposal': 'Withdraw Proposal',
      'withdraw_proposal_confirm': 'Are you sure you want to withdraw this proposal?',
      'accepted': 'Accepted',
      'rejected': 'Rejected',

      // Messages
      'conversations': 'Conversations',
      'no_messages': 'No messages yet',
      'type_message': 'Type a message...',
      'send': 'Send',
      'reply': 'Reply',
      'message_client': 'Message Client',
      'search_messages': 'Search messages',
      'online': 'Online',
      'offline': 'Offline',
      'typing': 'typing...',
      'today': 'Today',
      'yesterday': 'Yesterday',

      // Orders
      'active_orders': 'Active',
      'completed_orders': 'Completed',
      'order_details': 'Order Details',
      'milestones': 'Milestones',
      'deliverables': 'Deliverables',
      'submit_deliverable': 'Submit Deliverable',
      'mark_complete': 'Mark as Complete',
      'search_orders': 'Search orders',
      'hired_by': 'Hired by',
      'total': 'Total',
      'earned': 'Earned',
      'present': 'Present',
      'total_budget': 'Total Budget',
      'remaining': 'Remaining',
      'timeline': 'Timeline',
      'get_help': 'Get Help',

      // Notifications/Alerts
      'mark_all_read': 'Mark all read',
      'marked_all_read': 'All notifications marked as read',
      'proposal_viewed': 'Proposal Viewed',
      'new_message': 'New Message',
      'order_update': 'Order Update',
      'payment_received': 'Payment Received',
      'system_notification': 'System Notification',
      'view_proposal': 'View Proposal',
      'view_order': 'View Order',

      // Profile
      'edit_profile': 'Edit Profile',
      'settings': 'Settings',
      'language': 'Language',
      'theme': 'Theme',
      'about': 'About',
      'help': 'Help & Support',
      'terms': 'Terms of Service',
      'privacy': 'Privacy Policy',
      'portfolio': 'Portfolio',
      'work_history': 'Work History',
      'skills': 'Skills',
      'reviews': 'Reviews',
      'job_success': 'Job Success',

      // User Types
      'client': 'Client',
      'consultant': 'Consultant',

      // Status
      'pending': 'Pending',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'in_progress': 'In Progress',
    },
    'ar': {
      // General
      'app_name': 'تشاور',
      'loading': 'جاري التحميل...',
      'error': 'خطأ',
      'success': 'نجاح',
      'cancel': 'إلغاء',
      'confirm': 'تأكيد',
      'save': 'حفظ',
      'delete': 'حذف',
      'edit': 'تعديل',
      'close': 'إغلاق',
      'search': 'بحث',
      'no_data': 'لا توجد بيانات',
      'try_again': 'حاول مرة أخرى',
      'view_all': 'عرض الكل',
      'all': 'الكل',
      'read_more': 'اقرأ المزيد',
      'view_details': 'عرض التفاصيل',

      // Auth
      'login': 'تسجيل الدخول',
      'register': 'إنشاء حساب',
      'logout': 'تسجيل الخروج',
      'email': 'البريد الإلكتروني',
      'password': 'كلمة المرور',
      'confirm_password': 'تأكيد كلمة المرور',
      'forgot_password': 'نسيت كلمة المرور؟',
      'full_name': 'الاسم الكامل',
      'phone': 'رقم الهاتف',
      'welcome_back': 'مرحباً بعودتك',
      'create_account': 'إنشاء حساب جديد',
      'already_have_account': 'لديك حساب بالفعل؟',
      'dont_have_account': 'ليس لديك حساب؟',
      'login_success': 'تم تسجيل الدخول بنجاح',
      'register_success': 'تم إنشاء الحساب بنجاح',

      // Navigation
      'projects': 'المشاريع',
      'messages': 'الرسائل',
      'orders': 'الطلبات',
      'notifications': 'الإشعارات',
      'alerts': 'التنبيهات',
      'profile': 'الملف الشخصي',
      'proposals': 'العروض',

      // Projects
      'open_projects': 'المشاريع المفتوحة',
      'my_projects': 'مشاريعي',
      'create_project': 'إنشاء مشروع',
      'project_details': 'تفاصيل المشروع',
      'project_title': 'عنوان المشروع',
      'project_description': 'وصف المشروع',
      'budget': 'الميزانية',
      'deadline': 'الموعد النهائي',
      'category': 'الفئة',
      'skills_required': 'المهارات المطلوبة',
      'submit_proposal': 'تقديم عرض',
      'no_projects': 'لا توجد مشاريع',
      'fixed_price': 'سعر ثابت',
      'posted': 'نُشر',
      'apply_now': 'تقدم الآن',
      'save_project': 'حفظ المشروع',

      // Proposals
      'my_proposals': 'عروضي',
      'proposal_details': 'تفاصيل العرض',
      'cover_letter': 'خطاب التقديم',
      'proposed_budget': 'الميزانية المقترحة',
      'delivery_time': 'مدة التسليم',
      'days': 'أيام',
      'accept': 'قبول',
      'reject': 'رفض',
      'invites': 'الدعوات',
      'discussing': 'قيد المناقشة',
      'submitted': 'مُقدم',
      'active': 'نشط',
      'archived': 'مؤرشف',
      'drafts': 'مسودات',
      'filter_proposals': 'تصفية العروض',
      'sort_by_date': 'ترتيب حسب التاريخ',
      'sort_by_budget': 'ترتيب حسب الميزانية',
      'proposal_submitted': 'تم تقديم عرضك',
      'proposal_submitted_desc': 'يمكنك تعديل أي تفاصيل لمدة 6 ساعات، أو حتى يتم عرض عرضك.',
      'job_details': 'تفاصيل المشروع',
      'what_we_need': 'ما نحتاجه',
      'your_proposed_terms': 'شروطك المقترحة',
      'edit_proposal': 'تعديل العرض',
      'edit_proposal_info': 'يمكنك تعديل أي تفاصيل لمدة 6 ساعات، أو حتى يتم عرض عرضك.',
      'withdraw': 'سحب',
      'withdraw_proposal': 'سحب العرض',
      'withdraw_proposal_confirm': 'هل أنت متأكد من رغبتك في سحب هذا العرض؟',
      'accepted': 'مقبول',
      'rejected': 'مرفوض',

      // Messages
      'conversations': 'المحادثات',
      'no_messages': 'لا توجد رسائل',
      'type_message': 'اكتب رسالة...',
      'send': 'إرسال',
      'reply': 'رد',
      'message_client': 'مراسلة العميل',
      'search_messages': 'البحث في الرسائل',
      'online': 'متصل',
      'offline': 'غير متصل',
      'typing': 'يكتب...',
      'today': 'اليوم',
      'yesterday': 'أمس',

      // Orders
      'active_orders': 'النشطة',
      'completed_orders': 'المكتملة',
      'order_details': 'تفاصيل الطلب',
      'milestones': 'المراحل',
      'deliverables': 'التسليمات',
      'submit_deliverable': 'تقديم تسليم',
      'mark_complete': 'تحديد كمكتمل',
      'search_orders': 'البحث في الطلبات',
      'hired_by': 'تم التعاقد من قِبل',
      'total': 'الإجمالي',
      'earned': 'المكتسب',
      'present': 'الحالي',
      'total_budget': 'إجمالي الميزانية',
      'remaining': 'المتبقي',
      'timeline': 'الجدول الزمني',
      'get_help': 'طلب المساعدة',

      // Notifications/Alerts
      'mark_all_read': 'تحديد الكل كمقروء',
      'marked_all_read': 'تم تحديد جميع الإشعارات كمقروءة',
      'proposal_viewed': 'تم عرض عرضك',
      'new_message': 'رسالة جديدة',
      'order_update': 'تحديث الطلب',
      'payment_received': 'تم استلام الدفعة',
      'system_notification': 'إشعار النظام',
      'view_proposal': 'عرض العرض',
      'view_order': 'عرض الطلب',

      // Profile
      'edit_profile': 'تعديل الملف الشخصي',
      'settings': 'الإعدادات',
      'language': 'اللغة',
      'theme': 'المظهر',
      'about': 'حول التطبيق',
      'help': 'المساعدة والدعم',
      'terms': 'شروط الخدمة',
      'privacy': 'سياسة الخصوصية',
      'portfolio': 'الأعمال السابقة',
      'work_history': 'تاريخ العمل',
      'skills': 'المهارات',
      'reviews': 'التقييمات',
      'job_success': 'نجاح الأعمال',

      // User Types
      'client': 'عميل',
      'consultant': 'مستشار',

      // Status
      'pending': 'قيد الانتظار',
      'completed': 'مكتمل',
      'cancelled': 'ملغي',
      'in_progress': 'قيد التنفيذ',
    },
  };

  String translate(String key) {
    return _localizedValues[locale.languageCode]?[key] ?? key;
  }

  // Getters for common translations
  String get appName => translate('app_name');
  String get loading => translate('loading');
  String get error => translate('error');
  String get success => translate('success');
  String get cancel => translate('cancel');
  String get confirm => translate('confirm');
  String get save => translate('save');
  String get login => translate('login');
  String get register => translate('register');
  String get logout => translate('logout');
  String get projects => translate('projects');
  String get messages => translate('messages');
  String get orders => translate('orders');
  String get notifications => translate('notifications');
  String get profile => translate('profile');
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['en', 'ar'].contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

/// Extension for easy access
extension LocalizationsExtension on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);
}
