import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/colors.dart';
import '../../../../l10n/app_localizations.dart';

/// Project details page
class ProjectDetailsPage extends ConsumerWidget {
  final String projectId;

  const ProjectDetailsPage({super.key, required this.projectId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.translate('project_details')),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            onPressed: () {
              // TODO: Share project
            },
          ),
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () {
              // TODO: Show more options
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Project header
            Container(
              padding: const EdgeInsets.all(16),
              color: TashawerColors.surface,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'تصميم موقع إلكتروني للتجارة',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: TashawerColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: TashawerColors.successBg,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          l10n.translate('active'),
                          style: const TextStyle(
                            fontSize: 12,
                            color: TashawerColors.success,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'Posted 2 days ago',
                        style: TextStyle(
                          fontSize: 12,
                          color: TashawerColors.textTertiary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // Budget and timeline
            Container(
              padding: const EdgeInsets.all(16),
              color: TashawerColors.surface,
              child: Row(
                children: [
                  Expanded(
                    child: _InfoColumn(
                      icon: Icons.attach_money,
                      label: l10n.translate('budget'),
                      value: 'SAR 5,000 - 10,000',
                    ),
                  ),
                  Container(
                    width: 1,
                    height: 40,
                    color: TashawerColors.border,
                  ),
                  Expanded(
                    child: _InfoColumn(
                      icon: Icons.calendar_today,
                      label: l10n.translate('deadline'),
                      value: '30 days',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // Description
            Container(
              padding: const EdgeInsets.all(16),
              color: TashawerColors.surface,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.translate('project_description'),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: TashawerColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'نحتاج مصمم محترف لتصميم موقع تجارة إلكترونية متكامل يتضمن:\n\n'
                    '• صفحة رئيسية جذابة\n'
                    '• صفحات المنتجات\n'
                    '• سلة التسوق\n'
                    '• نظام الدفع\n'
                    '• لوحة تحكم للإدارة\n\n'
                    'يجب أن يكون التصميم متجاوب مع جميع الأجهزة.',
                    style: TextStyle(
                      fontSize: 14,
                      color: TashawerColors.textSecondary,
                      height: 1.6,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // Skills
            Container(
              padding: const EdgeInsets.all(16),
              color: TashawerColors.surface,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.translate('skills_required'),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: TashawerColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _SkillChip(label: 'UI/UX Design'),
                      _SkillChip(label: 'Figma'),
                      _SkillChip(label: 'E-commerce'),
                      _SkillChip(label: 'Responsive Design'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // Client info
            Container(
              padding: const EdgeInsets.all(16),
              color: TashawerColors.surface,
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: TashawerColors.primaryBg,
                    child: const Text(
                      'أ',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: TashawerColors.primary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'أحمد محمد',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: TashawerColors.textPrimary,
                          ),
                        ),
                        Text(
                          '5 projects posted',
                          style: TextStyle(
                            fontSize: 12,
                            color: TashawerColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  OutlinedButton(
                    onPressed: () {
                      // TODO: Navigate to messages
                    },
                    child: Text(l10n.messages),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 100), // Space for bottom button
          ],
        ),
      ),
      bottomSheet: Container(
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
          child: SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                // TODO: Submit proposal
              },
              child: Text(l10n.translate('submit_proposal')),
            ),
          ),
        ),
      ),
    );
  }
}

class _InfoColumn extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoColumn({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: TashawerColors.primary, size: 24),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: TashawerColors.textSecondary,
          ),
        ),
        const SizedBox(height: 4),
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

class _SkillChip extends StatelessWidget {
  final String label;

  const _SkillChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: TashawerColors.primaryBg,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 12,
          color: TashawerColors.primary,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
