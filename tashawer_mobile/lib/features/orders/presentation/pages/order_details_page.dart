import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/colors.dart';
import '../../../../l10n/app_localizations.dart';

/// Upwork-style Order/Contract Details page
class OrderDetailsPage extends ConsumerWidget {
  final String orderId;

  const OrderDetailsPage({super.key, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;

    return Scaffold(
      backgroundColor: TashawerColors.background,
      appBar: AppBar(
        backgroundColor: TashawerColors.surface,
        surfaceTintColor: Colors.transparent,
        title: Text(
          l10n.translate('order_details'),
          style: const TextStyle(color: TashawerColors.textPrimary),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: TashawerColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert, color: TashawerColors.textSecondary),
            onPressed: () => _showOptionsMenu(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Order header card
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: TashawerColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: TashawerColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: TashawerColors.successBg,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          l10n.translate('active'),
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: TashawerColors.success,
                          ),
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '#ORD-${orderId.substring(0, 6).toUpperCase()}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: TashawerColors.textTertiary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'تصميم تطبيق موبايل للتجارة الإلكترونية',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: TashawerColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Client info
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundColor: TashawerColors.primaryBg,
                        child: const Text(
                          'ش',
                          style: TextStyle(
                            color: TashawerColors.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              l10n.translate('client'),
                              style: const TextStyle(
                                fontSize: 12,
                                color: TashawerColors.textTertiary,
                              ),
                            ),
                            Row(
                              children: [
                                const Text(
                                  'شركة التقنية المتقدمة',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: TashawerColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Icon(
                                  Icons.verified,
                                  size: 16,
                                  color: TashawerColors.primary,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.chat_bubble_outline),
                        onPressed: () {},
                        color: TashawerColors.primary,
                      ),
                    ],
                  ),
                  const Divider(height: 24),
                  // Order stats
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _StatItem(
                        label: l10n.translate('total_budget'),
                        value: 'SAR 15,000',
                        icon: Icons.attach_money,
                      ),
                      _StatItem(
                        label: l10n.translate('earned'),
                        value: 'SAR 5,000',
                        icon: Icons.account_balance_wallet,
                      ),
                      _StatItem(
                        label: l10n.translate('remaining'),
                        value: 'SAR 10,000',
                        icon: Icons.hourglass_empty,
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Milestones section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                l10n.translate('milestones'),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: TashawerColors.textPrimary,
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Milestone cards
            _MilestoneCard(
              number: 1,
              title: 'تصميم الواجهات UI/UX',
              amount: 'SAR 5,000',
              status: 'completed',
              dueDate: 'Jan 15, 2025',
            ),
            _MilestoneCard(
              number: 2,
              title: 'تطوير الواجهة الأمامية',
              amount: 'SAR 5,000',
              status: 'active',
              dueDate: 'Feb 01, 2025',
            ),
            _MilestoneCard(
              number: 3,
              title: 'تطوير الباك إند و API',
              amount: 'SAR 5,000',
              status: 'pending',
              dueDate: 'Feb 15, 2025',
            ),

            const SizedBox(height: 24),

            // Timeline section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                l10n.translate('timeline'),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: TashawerColors.textPrimary,
                ),
              ),
            ),
            const SizedBox(height: 12),

            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: TashawerColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: TashawerColors.border),
              ),
              child: Column(
                children: [
                  _TimelineItem(
                    title: 'Order started',
                    date: 'Jan 01, 2025',
                    isFirst: true,
                  ),
                  _TimelineItem(
                    title: 'Milestone 1 completed',
                    date: 'Jan 15, 2025',
                  ),
                  _TimelineItem(
                    title: 'Milestone 2 in progress',
                    date: 'Jan 20, 2025',
                    isActive: true,
                  ),
                  _TimelineItem(
                    title: 'Expected completion',
                    date: 'Feb 15, 2025',
                    isLast: true,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 100),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: TashawerColors.surface,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: SafeArea(
          child: ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: TashawerColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text(l10n.translate('submit_deliverable')),
          ),
        ),
      ),
    );
  }

  void _showOptionsMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: TashawerColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.message),
                title: Text(context.l10n.translate('message_client')),
                onTap: () => Navigator.pop(context),
              ),
              ListTile(
                leading: const Icon(Icons.upload_file),
                title: Text(context.l10n.translate('submit_deliverable')),
                onTap: () => Navigator.pop(context),
              ),
              ListTile(
                leading: const Icon(Icons.help_outline),
                title: Text(context.l10n.translate('get_help')),
                onTap: () => Navigator.pop(context),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _StatItem({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: TashawerColors.primary, size: 24),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: TashawerColors.textPrimary,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: TashawerColors.textTertiary,
          ),
        ),
      ],
    );
  }
}

class _MilestoneCard extends StatelessWidget {
  final int number;
  final String title;
  final String amount;
  final String status;
  final String dueDate;

  const _MilestoneCard({
    required this.number,
    required this.title,
    required this.amount,
    required this.status,
    required this.dueDate,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: TashawerColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: status == 'active' ? TashawerColors.primary : TashawerColors.border,
          width: status == 'active' ? 2 : 1,
        ),
      ),
      child: Row(
        children: [
          // Milestone number
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: _getStatusColor().withOpacity(0.1),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Center(
              child: status == 'completed'
                  ? Icon(Icons.check, color: _getStatusColor(), size: 20)
                  : Text(
                      '$number',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: _getStatusColor(),
                      ),
                    ),
            ),
          ),
          const SizedBox(width: 12),
          // Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: TashawerColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Due: $dueDate',
                  style: const TextStyle(
                    fontSize: 12,
                    color: TashawerColors.textTertiary,
                  ),
                ),
              ],
            ),
          ),
          // Amount and status
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                amount,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: TashawerColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: _getStatusColor().withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  _getStatusLabel(context),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: _getStatusColor(),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _getStatusColor() {
    switch (status) {
      case 'completed':
        return TashawerColors.success;
      case 'active':
        return TashawerColors.primary;
      case 'pending':
        return TashawerColors.textTertiary;
      default:
        return TashawerColors.textSecondary;
    }
  }

  String _getStatusLabel(BuildContext context) {
    switch (status) {
      case 'completed':
        return context.l10n.translate('completed');
      case 'active':
        return context.l10n.translate('active');
      case 'pending':
        return context.l10n.translate('pending');
      default:
        return status;
    }
  }
}

class _TimelineItem extends StatelessWidget {
  final String title;
  final String date;
  final bool isFirst;
  final bool isLast;
  final bool isActive;

  const _TimelineItem({
    required this.title,
    required this.date,
    this.isFirst = false,
    this.isLast = false,
    this.isActive = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: isActive ? TashawerColors.primary : TashawerColors.border,
                shape: BoxShape.circle,
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 40,
                color: TashawerColors.border,
              ),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                    color: isActive ? TashawerColors.primary : TashawerColors.textPrimary,
                  ),
                ),
                Text(
                  date,
                  style: const TextStyle(
                    fontSize: 12,
                    color: TashawerColors.textTertiary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
