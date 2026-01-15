import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/colors.dart';
import '../../../../l10n/app_localizations.dart';

/// Upwork-style Orders/Contracts page with search and tabs
class OrdersPage extends ConsumerStatefulWidget {
  const OrdersPage({super.key});

  @override
  ConsumerState<OrdersPage> createState() => _OrdersPageState();
}

class _OrdersPageState extends ConsumerState<OrdersPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
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
              title: _isSearching
                  ? TextField(
                      controller: _searchController,
                      autofocus: true,
                      decoration: InputDecoration(
                        hintText: l10n.translate('search_orders'),
                        border: InputBorder.none,
                        hintStyle: const TextStyle(color: TashawerColors.textTertiary),
                      ),
                      style: const TextStyle(color: TashawerColors.textPrimary),
                    )
                  : Text(
                      l10n.orders,
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
              bottom: TabBar(
                controller: _tabController,
                indicatorColor: TashawerColors.primary,
                labelColor: TashawerColors.primary,
                unselectedLabelColor: TashawerColors.textSecondary,
                indicatorWeight: 3,
                labelStyle: const TextStyle(fontWeight: FontWeight.w600),
                tabs: [
                  Tab(text: l10n.translate('all')),
                  Tab(text: l10n.translate('active_orders')),
                  Tab(text: l10n.translate('completed_orders')),
                ],
              ),
            ),
          ];
        },
        body: TabBarView(
          controller: _tabController,
          children: [
            _OrdersList(filter: 'all'),
            _OrdersList(filter: 'active'),
            _OrdersList(filter: 'completed'),
          ],
        ),
      ),
    );
  }
}

class _OrdersList extends StatelessWidget {
  final String filter;

  const _OrdersList({required this.filter});

  @override
  Widget build(BuildContext context) {
    // TODO: Replace with actual data from API
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      itemBuilder: (context, index) {
        final isActive = index % 2 == 0;
        return _OrderCard(
          projectTitle: 'تصميم تطبيق موبايل للتجارة الإلكترونية',
          clientName: 'شركة التقنية المتقدمة',
          isClientVerified: true,
          totalBudget: 'SAR 15,000',
          earnedAmount: 'SAR ${(index + 1) * 2500}',
          status: isActive ? 'active' : 'completed',
          startDate: 'Jan ${10 + index}, 2025',
          activeMilestone: isActive ? 'Milestone ${index + 1}' : null,
          onTap: () {
            context.push('/orders/order_$index');
          },
        );
      },
    );
  }
}

class _OrderCard extends StatelessWidget {
  final String projectTitle;
  final String clientName;
  final bool isClientVerified;
  final String totalBudget;
  final String earnedAmount;
  final String status;
  final String startDate;
  final String? activeMilestone;
  final VoidCallback onTap;

  const _OrderCard({
    required this.projectTitle,
    required this.clientName,
    required this.isClientVerified,
    required this.totalBudget,
    required this.earnedAmount,
    required this.status,
    required this.startDate,
    this.activeMilestone,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final isActive = status == 'active';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isActive ? TashawerColors.primary.withOpacity(0.3) : TashawerColors.border,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Project title with link style
              Text(
                projectTitle,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: TashawerColors.primary,
                  decoration: TextDecoration.underline,
                  decorationColor: TashawerColors.primary,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              // Client info
              Row(
                children: [
                  Text(
                    '${l10n.translate('hired_by')} ',
                    style: const TextStyle(
                      fontSize: 13,
                      color: TashawerColors.textTertiary,
                    ),
                  ),
                  Expanded(
                    child: Text(
                      clientName,
                      style: const TextStyle(
                        fontSize: 13,
                        color: TashawerColors.textSecondary,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (isClientVerified)
                    const Icon(
                      Icons.verified,
                      size: 14,
                      color: TashawerColors.primary,
                    ),
                ],
              ),
              const SizedBox(height: 12),
              // Status badge
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: isActive ? TashawerColors.successBg : TashawerColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      isActive ? l10n.translate('active') : l10n.translate('completed'),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isActive ? TashawerColors.success : TashawerColors.textSecondary,
                      ),
                    ),
                  ),
                  if (activeMilestone != null) ...[
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        activeMilestone!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: TashawerColors.textTertiary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 12),
              // Budget info
              Row(
                children: [
                  _InfoColumn(
                    label: l10n.translate('total'),
                    value: totalBudget,
                  ),
                  const SizedBox(width: 24),
                  _InfoColumn(
                    label: l10n.translate('earned'),
                    value: earnedAmount,
                    valueColor: TashawerColors.success,
                  ),
                ],
              ),
              const Divider(height: 24),
              // Footer with date and actions
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '$startDate - ${isActive ? l10n.translate('present') : 'Feb 15, 2025'}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: TashawerColors.textTertiary,
                    ),
                  ),
                  if (isActive)
                    OutlinedButton(
                      onPressed: onTap,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: TashawerColors.primary,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        side: const BorderSide(color: TashawerColors.primary),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6),
                        ),
                        minimumSize: Size.zero,
                      ),
                      child: Text(
                        l10n.translate('view_details'),
                        style: const TextStyle(fontSize: 12),
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

class _InfoColumn extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _InfoColumn({
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: TashawerColors.textTertiary,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: valueColor ?? TashawerColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
