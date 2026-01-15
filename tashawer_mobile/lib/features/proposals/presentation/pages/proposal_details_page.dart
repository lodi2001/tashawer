import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/colors.dart';
import '../../../../l10n/app_localizations.dart';

/// Upwork-style Proposal Details page
class ProposalDetailsPage extends ConsumerWidget {
  final String proposalId;

  const ProposalDetailsPage({super.key, required this.proposalId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;

    return Scaffold(
      backgroundColor: TashawerColors.background,
      appBar: AppBar(
        backgroundColor: TashawerColors.surface,
        surfaceTintColor: Colors.transparent,
        title: Text(
          l10n.translate('proposal_details'),
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
            // Status banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              color: TashawerColors.successBg,
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: TashawerColors.success),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.translate('proposal_submitted'),
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            color: TashawerColors.success,
                          ),
                        ),
                        Text(
                          l10n.translate('proposal_submitted_desc'),
                          style: const TextStyle(
                            fontSize: 12,
                            color: TashawerColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: () {},
                  ),
                ],
              ),
            ),

            // Project details section
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
                  Text(
                    l10n.translate('job_details'),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: TashawerColors.textSecondary,
                    ),
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
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: TashawerColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'Mobile Development',
                      style: TextStyle(
                        fontSize: 12,
                        color: TashawerColors.textSecondary,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Posted Feb 12, 2025',
                    style: TextStyle(
                      fontSize: 12,
                      color: TashawerColors.textTertiary,
                    ),
                  ),
                  const Divider(height: 24),
                  Text(
                    l10n.translate('what_we_need'),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: TashawerColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'نبحث عن مطور محترف لتصميم وتطوير تطبيق موبايل للتجارة الإلكترونية. '
                    'يجب أن يتضمن التطبيق نظام سلة تسوق، بوابة دفع، وإشعارات فورية.',
                    style: TextStyle(
                      fontSize: 14,
                      color: TashawerColors.textSecondary,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () {},
                    child: Text(
                      l10n.translate('read_more'),
                      style: const TextStyle(color: TashawerColors.primary),
                    ),
                  ),
                ],
              ),
            ),

            // Your proposed terms section
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: TashawerColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: TashawerColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.translate('your_proposed_terms'),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: TashawerColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _TermRow(
                    label: l10n.translate('proposed_budget'),
                    value: 'SAR 8,000',
                  ),
                  const SizedBox(height: 12),
                  _TermRow(
                    label: l10n.translate('delivery_time'),
                    value: '14 ${l10n.translate('days')}',
                  ),
                  const Divider(height: 24),
                  Text(
                    l10n.translate('cover_letter'),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: TashawerColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'السلام عليكم، أنا مطور تطبيقات موبايل بخبرة 5 سنوات في Flutter و React Native. '
                    'قمت بتطوير أكثر من 20 تطبيق للتجارة الإلكترونية وأستطيع تنفيذ مشروعكم بجودة عالية...',
                    style: TextStyle(
                      fontSize: 14,
                      color: TashawerColors.textSecondary,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),

            // Edit info
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Icon(
                    Icons.info_outline,
                    size: 18,
                    color: TashawerColors.textTertiary,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      l10n.translate('edit_proposal_info'),
                      style: const TextStyle(
                        fontSize: 12,
                        color: TashawerColors.textTertiary,
                      ),
                    ),
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
          child: Row(
            children: [
              Expanded(
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
                  child: Text(l10n.translate('edit_proposal')),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _showWithdrawDialog(context),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: TashawerColors.error,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: const BorderSide(color: TashawerColors.error),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: Text(l10n.translate('withdraw')),
                ),
              ),
            ],
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
                leading: const Icon(Icons.edit),
                title: Text(context.l10n.translate('edit_proposal')),
                onTap: () => Navigator.pop(context),
              ),
              ListTile(
                leading: const Icon(Icons.message),
                title: Text(context.l10n.translate('message_client')),
                onTap: () => Navigator.pop(context),
              ),
              ListTile(
                leading: const Icon(Icons.delete_outline, color: TashawerColors.error),
                title: Text(
                  context.l10n.translate('withdraw'),
                  style: const TextStyle(color: TashawerColors.error),
                ),
                onTap: () {
                  Navigator.pop(context);
                  _showWithdrawDialog(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _showWithdrawDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(context.l10n.translate('withdraw_proposal')),
          content: Text(context.l10n.translate('withdraw_proposal_confirm')),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(context.l10n.cancel),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                // TODO: Withdraw proposal
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: TashawerColors.error,
              ),
              child: Text(context.l10n.translate('withdraw')),
            ),
          ],
        );
      },
    );
  }
}

class _TermRow extends StatelessWidget {
  final String label;
  final String value;

  const _TermRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            color: TashawerColors.textSecondary,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: TashawerColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
