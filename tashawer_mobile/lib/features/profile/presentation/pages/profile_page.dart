import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/routes.dart';
import '../../../../core/constants/colors.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../shared/providers/auth_provider.dart';

/// Profile page
class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final authState = ref.watch(authStateProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.profile),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () {
              // TODO: Navigate to settings
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Profile header
            Container(
              padding: const EdgeInsets.all(24),
              color: TashawerColors.surface,
              child: Column(
                children: [
                  // Avatar
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 50,
                        backgroundColor: TashawerColors.primaryBg,
                        child: const Text(
                          'م',
                          style: TextStyle(
                            fontSize: 36,
                            fontWeight: FontWeight.bold,
                            color: TashawerColors.primary,
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: TashawerColors.primary,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.camera_alt,
                            size: 16,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'محمد عبدالله',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: TashawerColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'mohamed@email.com',
                    style: TextStyle(
                      fontSize: 14,
                      color: TashawerColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: TashawerColors.primaryBg,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      l10n.translate('consultant'),
                      style: const TextStyle(
                        fontSize: 12,
                        color: TashawerColors.primary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: () {
                      // TODO: Edit profile
                    },
                    icon: const Icon(Icons.edit_outlined, size: 18),
                    label: Text(l10n.translate('edit_profile')),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // Stats
            Container(
              padding: const EdgeInsets.symmetric(vertical: 16),
              color: TashawerColors.surface,
              child: const Row(
                children: [
                  _StatItem(label: 'Projects', value: '24'),
                  _StatItem(label: 'Orders', value: '18'),
                  _StatItem(label: 'Rating', value: '4.9'),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // Menu items
            Container(
              color: TashawerColors.surface,
              child: Column(
                children: [
                  _MenuItem(
                    icon: Icons.language,
                    title: l10n.translate('language'),
                    subtitle: 'العربية',
                    onTap: () {
                      // TODO: Change language
                    },
                  ),
                  const Divider(height: 1),
                  _MenuItem(
                    icon: Icons.dark_mode_outlined,
                    title: l10n.translate('theme'),
                    subtitle: 'System',
                    onTap: () {
                      // TODO: Change theme
                    },
                  ),
                  const Divider(height: 1),
                  _MenuItem(
                    icon: Icons.notifications_outlined,
                    title: l10n.notifications,
                    onTap: () {
                      // TODO: Notification settings
                    },
                  ),
                  const Divider(height: 1),
                  _MenuItem(
                    icon: Icons.help_outline,
                    title: l10n.translate('help'),
                    onTap: () {
                      // TODO: Help
                    },
                  ),
                  const Divider(height: 1),
                  _MenuItem(
                    icon: Icons.description_outlined,
                    title: l10n.translate('terms'),
                    onTap: () {
                      // TODO: Terms
                    },
                  ),
                  const Divider(height: 1),
                  _MenuItem(
                    icon: Icons.privacy_tip_outlined,
                    title: l10n.translate('privacy'),
                    onTap: () {
                      // TODO: Privacy
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // Logout
            Container(
              color: TashawerColors.surface,
              child: _MenuItem(
                icon: Icons.logout,
                title: l10n.logout,
                iconColor: TashawerColors.error,
                titleColor: TashawerColors.error,
                onTap: () async {
                  // Confirm logout
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: Text(l10n.logout),
                      content: const Text('Are you sure you want to logout?'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: Text(l10n.cancel),
                        ),
                        TextButton(
                          onPressed: () => Navigator.pop(context, true),
                          child: Text(
                            l10n.logout,
                            style: const TextStyle(color: TashawerColors.error),
                          ),
                        ),
                      ],
                    ),
                  );

                  if (confirm == true) {
                    authState.logout();
                    if (context.mounted) {
                      context.go(AppRoutes.login);
                    }
                  }
                },
              ),
            ),
            const SizedBox(height: 24),

            // App version
            Text(
              'Version 1.0.0',
              style: TextStyle(
                fontSize: 12,
                color: TashawerColors.textTertiary,
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;

  const _StatItem({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: TashawerColors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: TashawerColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Color? iconColor;
  final Color? titleColor;
  final VoidCallback onTap;

  const _MenuItem({
    required this.icon,
    required this.title,
    this.subtitle,
    this.iconColor,
    this.titleColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(
        icon,
        color: iconColor ?? TashawerColors.textSecondary,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: titleColor ?? TashawerColors.textPrimary,
          fontWeight: FontWeight.w500,
        ),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (subtitle != null)
            Text(
              subtitle!,
              style: const TextStyle(
                fontSize: 14,
                color: TashawerColors.textSecondary,
              ),
            ),
          const SizedBox(width: 8),
          Icon(
            Icons.chevron_right,
            color: TashawerColors.textTertiary,
          ),
        ],
      ),
      onTap: onTap,
    );
  }
}
