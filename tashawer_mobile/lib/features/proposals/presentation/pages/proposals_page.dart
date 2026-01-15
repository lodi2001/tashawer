import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/colors.dart';
import '../../../../l10n/app_localizations.dart';

/// Upwork-style Proposals page with tabs and filters
class ProposalsPage extends ConsumerStatefulWidget {
  const ProposalsPage({super.key});

  @override
  ConsumerState<ProposalsPage> createState() => _ProposalsPageState();
}

class _ProposalsPageState extends ConsumerState<ProposalsPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedFilter = 'all';

  final List<String> _filterOptions = ['all', 'invites', 'discussing', 'submitted'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      backgroundColor: TashawerColors.background,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            SliverAppBar(
              floating: true,
              pinned: true,
              snap: false,
              backgroundColor: TashawerColors.surface,
              surfaceTintColor: Colors.transparent,
              title: Text(
                l10n.translate('my_proposals'),
                style: const TextStyle(
                  color: TashawerColors.textPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.tune, color: TashawerColors.textSecondary),
                  onPressed: _showFilterSheet,
                ),
              ],
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(100),
                child: Column(
                  children: [
                    // Filter chips (Upwork style)
                    SizedBox(
                      height: 48,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _filterOptions.length,
                        itemBuilder: (context, index) {
                          final filter = _filterOptions[index];
                          final isSelected = _selectedFilter == filter;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: FilterChip(
                              label: Text(_getFilterLabel(filter, l10n)),
                              selected: isSelected,
                              onSelected: (selected) {
                                setState(() => _selectedFilter = filter);
                              },
                              backgroundColor: TashawerColors.surface,
                              selectedColor: TashawerColors.primaryBg,
                              checkmarkColor: TashawerColors.primary,
                              labelStyle: TextStyle(
                                color: isSelected
                                    ? TashawerColors.primary
                                    : TashawerColors.textSecondary,
                                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                                side: BorderSide(
                                  color: isSelected
                                      ? TashawerColors.primary
                                      : TashawerColors.border,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    // Tab bar
                    TabBar(
                      controller: _tabController,
                      indicatorColor: TashawerColors.primary,
                      labelColor: TashawerColors.primary,
                      unselectedLabelColor: TashawerColors.textSecondary,
                      indicatorWeight: 3,
                      labelStyle: const TextStyle(fontWeight: FontWeight.w600),
                      tabs: [
                        Tab(text: l10n.translate('active')),
                        Tab(text: l10n.translate('archived')),
                        Tab(text: l10n.translate('drafts')),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ];
        },
        body: TabBarView(
          controller: _tabController,
          children: [
            _ProposalsList(filter: _selectedFilter, status: 'active'),
            _ProposalsList(filter: _selectedFilter, status: 'archived'),
            _ProposalsList(filter: _selectedFilter, status: 'draft'),
          ],
        ),
      ),
    );
  }

  String _getFilterLabel(String filter, AppLocalizations l10n) {
    switch (filter) {
      case 'all':
        return l10n.translate('all');
      case 'invites':
        return l10n.translate('invites');
      case 'discussing':
        return l10n.translate('discussing');
      case 'submitted':
        return l10n.translate('submitted');
      default:
        return filter;
    }
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: TashawerColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    context.l10n.translate('filter_proposals'),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // Add filter options here
              ListTile(
                leading: const Icon(Icons.sort),
                title: Text(context.l10n.translate('sort_by_date')),
                onTap: () => Navigator.pop(context),
              ),
              ListTile(
                leading: const Icon(Icons.attach_money),
                title: Text(context.l10n.translate('sort_by_budget')),
                onTap: () => Navigator.pop(context),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ProposalsList extends StatelessWidget {
  final String filter;
  final String status;

  const _ProposalsList({required this.filter, required this.status});

  @override
  Widget build(BuildContext context) {
    // TODO: Replace with actual data from API
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      itemBuilder: (context, index) {
        return _ProposalCard(
          projectTitle: 'تصميم تطبيق موبايل للتجارة الإلكترونية',
          clientName: 'شركة التقنية المتقدمة',
          isClientVerified: true,
          proposedBudget: 'SAR 8,000',
          status: index % 3 == 0 ? 'pending' : (index % 3 == 1 ? 'discussing' : 'submitted'),
          submittedDate: '${index + 1} days ago',
          onTap: () {
            context.push('/proposals/proposal_$index');
          },
        );
      },
    );
  }
}

class _ProposalCard extends StatelessWidget {
  final String projectTitle;
  final String clientName;
  final bool isClientVerified;
  final String proposedBudget;
  final String status;
  final String submittedDate;
  final VoidCallback onTap;

  const _ProposalCard({
    required this.projectTitle,
    required this.clientName,
    required this.isClientVerified,
    required this.proposedBudget,
    required this.status,
    required this.submittedDate,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: TashawerColors.border),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Status badge
              _StatusBadge(status: status),
              const SizedBox(height: 12),
              // Project title
              Text(
                projectTitle,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: TashawerColors.textPrimary,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              // Client info
              Row(
                children: [
                  CircleAvatar(
                    radius: 14,
                    backgroundColor: TashawerColors.primaryBg,
                    child: Text(
                      clientName[0],
                      style: const TextStyle(
                        color: TashawerColors.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      clientName,
                      style: const TextStyle(
                        fontSize: 14,
                        color: TashawerColors.textSecondary,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (isClientVerified) ...[
                    const Icon(
                      Icons.verified,
                      size: 16,
                      color: TashawerColors.primary,
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 12),
              // Budget and date
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: TashawerColors.successBg,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.attach_money,
                          size: 14,
                          color: TashawerColors.success,
                        ),
                        Text(
                          proposedBudget,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: TashawerColors.success,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    submittedDate,
                    style: const TextStyle(
                      fontSize: 12,
                      color: TashawerColors.textTertiary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    Color textColor;
    String label;

    switch (status) {
      case 'pending':
        bgColor = TashawerColors.warningBg;
        textColor = TashawerColors.warning;
        label = context.l10n.translate('pending');
        break;
      case 'discussing':
        bgColor = TashawerColors.primaryBg;
        textColor = TashawerColors.primary;
        label = context.l10n.translate('discussing');
        break;
      case 'submitted':
        bgColor = TashawerColors.successBg;
        textColor = TashawerColors.success;
        label = context.l10n.translate('submitted');
        break;
      case 'accepted':
        bgColor = TashawerColors.successBg;
        textColor = TashawerColors.success;
        label = context.l10n.translate('accepted');
        break;
      case 'rejected':
        bgColor = TashawerColors.errorBg;
        textColor = TashawerColors.error;
        label = context.l10n.translate('rejected');
        break;
      default:
        bgColor = TashawerColors.surfaceVariant;
        textColor = TashawerColors.textSecondary;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }
}
