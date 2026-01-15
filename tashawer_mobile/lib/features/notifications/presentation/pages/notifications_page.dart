import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/colors.dart';
import '../../../../l10n/app_localizations.dart';

/// Upwork-style Notifications/Alerts page
class NotificationsPage extends ConsumerStatefulWidget {
  const NotificationsPage({super.key});

  @override
  ConsumerState<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends ConsumerState<NotificationsPage> {
  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      backgroundColor: TashawerColors.background,
      appBar: AppBar(
        backgroundColor: TashawerColors.surface,
        surfaceTintColor: Colors.transparent,
        title: Text(
          l10n.translate('alerts'),
          style: const TextStyle(
            color: TashawerColors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          TextButton(
            onPressed: _markAllAsRead,
            child: Text(
              l10n.translate('mark_all_read'),
              style: const TextStyle(color: TashawerColors.primary),
            ),
          ),
        ],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: 15,
        itemBuilder: (context, index) {
          return _NotificationItem(
            type: _getNotificationType(index),
            title: _getNotificationTitle(index, l10n),
            message: _getNotificationMessage(index),
            timeAgo: '${index + 1}h ago',
            isRead: index > 3,
            onTap: () => _handleNotificationTap(index),
          );
        },
      ),
    );
  }

  NotificationType _getNotificationType(int index) {
    final types = [
      NotificationType.proposal,
      NotificationType.message,
      NotificationType.order,
      NotificationType.payment,
      NotificationType.system,
    ];
    return types[index % types.length];
  }

  String _getNotificationTitle(int index, AppLocalizations l10n) {
    switch (_getNotificationType(index)) {
      case NotificationType.proposal:
        return l10n.translate('proposal_viewed');
      case NotificationType.message:
        return l10n.translate('new_message');
      case NotificationType.order:
        return l10n.translate('order_update');
      case NotificationType.payment:
        return l10n.translate('payment_received');
      case NotificationType.system:
        return l10n.translate('system_notification');
    }
  }

  String _getNotificationMessage(int index) {
    switch (_getNotificationType(index)) {
      case NotificationType.proposal:
        return 'شركة التقنية المتقدمة viewed your proposal for "تصميم تطبيق موبايل"';
      case NotificationType.message:
        return 'You have a new message from محمد أحمد';
      case NotificationType.order:
        return 'Order #12345 milestone has been approved';
      case NotificationType.payment:
        return 'You received SAR 5,000 for completed milestone';
      case NotificationType.system:
        return 'Your profile has been verified successfully';
    }
  }

  void _handleNotificationTap(int index) {
    // TODO: Navigate to appropriate screen based on notification type
  }

  void _markAllAsRead() {
    // TODO: Mark all notifications as read
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(context.l10n.translate('marked_all_read')),
        backgroundColor: TashawerColors.success,
      ),
    );
  }
}

enum NotificationType {
  proposal,
  message,
  order,
  payment,
  system,
}

class _NotificationItem extends StatelessWidget {
  final NotificationType type;
  final String title;
  final String message;
  final String timeAgo;
  final bool isRead;
  final VoidCallback onTap;

  const _NotificationItem({
    required this.type,
    required this.title,
    required this.message,
    required this.timeAgo,
    required this.isRead,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isRead ? TashawerColors.surface : TashawerColors.primaryBg.withOpacity(0.3),
          border: Border(
            bottom: BorderSide(color: TashawerColors.border.withOpacity(0.5)),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: _getIconBgColor(),
                borderRadius: BorderRadius.circular(22),
              ),
              child: Icon(
                _getIcon(),
                color: _getIconColor(),
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: isRead ? FontWeight.normal : FontWeight.w600,
                            color: TashawerColors.textPrimary,
                          ),
                        ),
                      ),
                      Text(
                        timeAgo,
                        style: const TextStyle(
                          fontSize: 12,
                          color: TashawerColors.textTertiary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    message,
                    style: const TextStyle(
                      fontSize: 13,
                      color: TashawerColors.textSecondary,
                      height: 1.4,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  // Action button based on type
                  _buildActionButton(context),
                ],
              ),
            ),
            if (!isRead)
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.only(left: 8, top: 4),
                decoration: const BoxDecoration(
                  color: TashawerColors.primary,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton(BuildContext context) {
    String? buttonText;
    VoidCallback? onPressed;

    switch (type) {
      case NotificationType.proposal:
        buttonText = context.l10n.translate('view_proposal');
        break;
      case NotificationType.message:
        buttonText = context.l10n.translate('reply');
        break;
      case NotificationType.order:
        buttonText = context.l10n.translate('view_order');
        break;
      case NotificationType.payment:
        buttonText = context.l10n.translate('view_details');
        break;
      case NotificationType.system:
        return const SizedBox.shrink();
    }

    return TextButton(
      onPressed: onPressed ?? onTap,
      style: TextButton.styleFrom(
        padding: EdgeInsets.zero,
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
      child: Text(
        buttonText,
        style: const TextStyle(
          color: TashawerColors.primary,
          fontWeight: FontWeight.w600,
          fontSize: 13,
        ),
      ),
    );
  }

  IconData _getIcon() {
    switch (type) {
      case NotificationType.proposal:
        return Icons.description;
      case NotificationType.message:
        return Icons.chat_bubble;
      case NotificationType.order:
        return Icons.assignment;
      case NotificationType.payment:
        return Icons.payments;
      case NotificationType.system:
        return Icons.info;
    }
  }

  Color _getIconColor() {
    switch (type) {
      case NotificationType.proposal:
        return TashawerColors.accent;
      case NotificationType.message:
        return TashawerColors.primary;
      case NotificationType.order:
        return TashawerColors.secondary;
      case NotificationType.payment:
        return TashawerColors.success;
      case NotificationType.system:
        return TashawerColors.textSecondary;
    }
  }

  Color _getIconBgColor() {
    switch (type) {
      case NotificationType.proposal:
        return TashawerColors.accent.withOpacity(0.1);
      case NotificationType.message:
        return TashawerColors.primaryBg;
      case NotificationType.order:
        return TashawerColors.secondaryBg;
      case NotificationType.payment:
        return TashawerColors.successBg;
      case NotificationType.system:
        return TashawerColors.surfaceVariant;
    }
  }
}
