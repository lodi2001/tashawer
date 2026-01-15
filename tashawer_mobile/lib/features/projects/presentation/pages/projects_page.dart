import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/colors.dart';
import '../../../../l10n/app_localizations.dart';

/// Upwork-style Projects/Jobs listing page
class ProjectsPage extends ConsumerStatefulWidget {
  const ProjectsPage({super.key});

  @override
  ConsumerState<ProjectsPage> createState() => _ProjectsPageState();
}

class _ProjectsPageState extends ConsumerState<ProjectsPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isSearching = false;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
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
                        hintText: l10n.translate('search'),
                        border: InputBorder.none,
                        hintStyle: const TextStyle(color: TashawerColors.textTertiary),
                      ),
                      style: const TextStyle(color: TashawerColors.textPrimary),
                    )
                  : Text(
                      l10n.projects,
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
                IconButton(
                  icon: const Icon(Icons.tune, color: TashawerColors.textSecondary),
                  onPressed: _showFilterSheet,
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
                  Tab(text: l10n.translate('open_projects')),
                  Tab(text: l10n.translate('my_projects')),
                ],
              ),
            ),
          ];
        },
        body: TabBarView(
          controller: _tabController,
          children: [
            _ProjectsList(isOpen: true),
            _ProjectsList(isOpen: false),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // TODO: Navigate to create project
        },
        backgroundColor: TashawerColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: Text(l10n.translate('create_project')),
      ),
    );
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
              ListTile(
                leading: const Icon(Icons.category),
                title: Text(context.l10n.translate('category')),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {},
              ),
              ListTile(
                leading: const Icon(Icons.attach_money),
                title: Text(context.l10n.translate('budget')),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {},
              ),
              ListTile(
                leading: const Icon(Icons.sort),
                title: Text(context.l10n.translate('sort_by_date')),
                onTap: () => Navigator.pop(context),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ProjectsList extends StatelessWidget {
  final bool isOpen;

  const _ProjectsList({required this.isOpen});

  @override
  Widget build(BuildContext context) {
    // TODO: Replace with actual data from API
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 10,
      itemBuilder: (context, index) {
        return _ProjectCard(
          title: 'تصميم موقع إلكتروني للتجارة الإلكترونية متكامل',
          description: 'نحتاج مصمم محترف لتصميم موقع تجارة إلكترونية متكامل مع لوحة تحكم وتطبيق موبايل. يجب أن يكون التصميم عصري وسهل الاستخدام.',
          clientName: 'شركة التقنية المتقدمة',
          isClientVerified: index % 2 == 0,
          clientRating: 4.8,
          clientSpent: '\$50K+',
          budget: 'SAR 5,000 - 10,000',
          budgetType: 'Fixed Price',
          category: 'Web Development',
          skills: ['Flutter', 'React', 'Node.js', 'PostgreSQL'],
          proposals: 12 + index,
          postedAgo: '${index + 1} hours ago',
          onTap: () {
            context.push('/projects/project_$index');
          },
        );
      },
    );
  }
}

class _ProjectCard extends StatelessWidget {
  final String title;
  final String description;
  final String clientName;
  final bool isClientVerified;
  final double clientRating;
  final String clientSpent;
  final String budget;
  final String budgetType;
  final String category;
  final List<String> skills;
  final int proposals;
  final String postedAgo;
  final VoidCallback onTap;

  const _ProjectCard({
    required this.title,
    required this.description,
    required this.clientName,
    required this.isClientVerified,
    required this.clientRating,
    required this.clientSpent,
    required this.budget,
    required this.budgetType,
    required this.category,
    required this.skills,
    required this.proposals,
    required this.postedAgo,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
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
              // Posted time and category
              Row(
                children: [
                  Text(
                    '${l10n.translate('posted')} $postedAgo',
                    style: const TextStyle(
                      fontSize: 12,
                      color: TashawerColors.textTertiary,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.bookmark_border, size: 20),
                    onPressed: () {},
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    color: TashawerColors.textTertiary,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              // Title
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: TashawerColors.primary,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              // Budget and type
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: TashawerColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      budgetType,
                      style: const TextStyle(
                        fontSize: 11,
                        color: TashawerColors.textSecondary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    budget,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: TashawerColors.textPrimary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Description
              Text(
                description,
                style: const TextStyle(
                  fontSize: 14,
                  color: TashawerColors.textSecondary,
                  height: 1.5,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),
              // Skills chips
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: skills.take(4).map((skill) {
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: TashawerColors.primaryBg,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      skill,
                      style: const TextStyle(
                        fontSize: 12,
                        color: TashawerColors.primary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              // Divider
              const Divider(height: 1),
              const SizedBox(height: 12),
              // Client info row
              Row(
                children: [
                  // Client verification badge
                  if (isClientVerified)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: TashawerColors.primaryBg,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.verified,
                            size: 12,
                            color: TashawerColors.primary,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            l10n.translate('client'),
                            style: const TextStyle(
                              fontSize: 11,
                              color: TashawerColors.primary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(width: 8),
                  // Rating
                  Row(
                    children: [
                      const Icon(
                        Icons.star,
                        size: 14,
                        color: TashawerColors.warning,
                      ),
                      const SizedBox(width: 2),
                      Text(
                        clientRating.toString(),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: TashawerColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  // Spent
                  Text(
                    '$clientSpent spent',
                    style: const TextStyle(
                      fontSize: 12,
                      color: TashawerColors.textTertiary,
                    ),
                  ),
                  const Spacer(),
                  // Proposals count
                  Row(
                    children: [
                      const Icon(
                        Icons.people_outline,
                        size: 14,
                        color: TashawerColors.textTertiary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '$proposals ${l10n.translate('proposals')}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: TashawerColors.textTertiary,
                        ),
                      ),
                    ],
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
