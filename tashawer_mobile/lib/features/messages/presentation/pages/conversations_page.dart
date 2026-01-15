import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/colors.dart';
import '../../../../l10n/app_localizations.dart';

/// Modern Conversations list page with search
class ConversationsPage extends ConsumerStatefulWidget {
  const ConversationsPage({super.key});

  @override
  ConsumerState<ConversationsPage> createState() => _ConversationsPageState();
}

class _ConversationsPageState extends ConsumerState<ConversationsPage> {
  bool _isSearching = false;
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      backgroundColor: TashawerColors.background,
      appBar: AppBar(
        backgroundColor: TashawerColors.surface,
        surfaceTintColor: Colors.transparent,
        title: _isSearching
            ? TextField(
                controller: _searchController,
                autofocus: true,
                decoration: InputDecoration(
                  hintText: l10n.translate('search_messages'),
                  border: InputBorder.none,
                  hintStyle: const TextStyle(color: TashawerColors.textTertiary),
                ),
                style: const TextStyle(color: TashawerColors.textPrimary),
              )
            : Text(
                l10n.messages,
                style: const TextStyle(
                  color: TashawerColors.textPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
        actions: [
          IconButton(
            icon: Icon(
              _isSearching ? Icons.close : Icons.search,
              color: TashawerColors.textSecondary,
            ),
            onPressed: () {
              setState(() {
                _isSearching = !_isSearching;
                if (!_isSearching) {
                  _searchController.clear();
                }
              });
            },
          ),
        ],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: 12,
        itemBuilder: (context, index) {
          // Add date headers
          if (index == 0) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _DateHeader(text: context.l10n.translate('today')),
                _ConversationTile(
                  name: 'أحمد محمد',
                  projectName: 'تصميم تطبيق موبايل',
                  lastMessage: 'شكراً لك، سأراجع العرض وأرد عليك',
                  time: '10:30 AM',
                  unreadCount: 3,
                  isOnline: true,
                  onTap: () => context.push('/messages/conv_$index'),
                ),
              ],
            );
          }
          if (index == 3) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _DateHeader(text: context.l10n.translate('yesterday')),
                _ConversationTile(
                  name: 'شركة التقنية المتقدمة',
                  projectName: 'تطوير موقع إلكتروني',
                  lastMessage: 'تم قبول عرضك، يرجى البدء في العمل',
                  time: '5:45 PM',
                  unreadCount: 0,
                  isOnline: false,
                  onTap: () => context.push('/messages/conv_$index'),
                ),
              ],
            );
          }

          return _ConversationTile(
            name: index % 2 == 0 ? 'محمد علي' : 'سارة أحمد',
            projectName: index % 2 == 0 ? 'تصميم واجهات' : 'استشارة تقنية',
            lastMessage: index % 2 == 0
                ? 'هل يمكنك إرسال التحديثات؟'
                : 'تم إرسال الملفات المطلوبة',
            time: '${index + 1}:00 PM',
            unreadCount: index == 1 ? 1 : 0,
            isOnline: index % 3 == 0,
            onTap: () => context.push('/messages/conv_$index'),
          );
        },
      ),
    );
  }
}

class _DateHeader extends StatelessWidget {
  final String text;

  const _DateHeader({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: TashawerColors.textTertiary,
        ),
      ),
    );
  }
}

class _ConversationTile extends StatelessWidget {
  final String name;
  final String projectName;
  final String lastMessage;
  final String time;
  final int unreadCount;
  final bool isOnline;
  final VoidCallback onTap;

  const _ConversationTile({
    required this.name,
    required this.projectName,
    required this.lastMessage,
    required this.time,
    required this.unreadCount,
    required this.isOnline,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final hasUnread = unreadCount > 0;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: hasUnread ? TashawerColors.primaryBg.withOpacity(0.3) : TashawerColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: hasUnread ? TashawerColors.primary.withOpacity(0.2) : TashawerColors.border,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Avatar with online indicator
              Stack(
                children: [
                  CircleAvatar(
                    radius: 26,
                    backgroundColor: TashawerColors.primaryBg,
                    child: Text(
                      name[0],
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: TashawerColors.primary,
                      ),
                    ),
                  ),
                  if (isOnline)
                    Positioned(
                      bottom: 2,
                      right: 2,
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: TashawerColors.success,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 12),
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Name and time
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            name,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: hasUnread ? FontWeight.bold : FontWeight.w600,
                              color: TashawerColors.textPrimary,
                            ),
                          ),
                        ),
                        Text(
                          time,
                          style: TextStyle(
                            fontSize: 12,
                            color: hasUnread
                                ? TashawerColors.primary
                                : TashawerColors.textTertiary,
                            fontWeight: hasUnread ? FontWeight.w600 : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    // Project name
                    Text(
                      projectName,
                      style: const TextStyle(
                        fontSize: 12,
                        color: TashawerColors.primary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    // Last message and unread count
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            lastMessage,
                            style: TextStyle(
                              fontSize: 13,
                              color: hasUnread
                                  ? TashawerColors.textPrimary
                                  : TashawerColors.textSecondary,
                              fontWeight: hasUnread ? FontWeight.w500 : FontWeight.normal,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (hasUnread) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: TashawerColors.primary,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              unreadCount.toString(),
                              style: const TextStyle(
                                fontSize: 11,
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
