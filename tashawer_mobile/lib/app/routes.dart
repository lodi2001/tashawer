import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/auth/presentation/pages/login_page.dart';
import '../features/auth/presentation/pages/register_page.dart';
import '../features/auth/presentation/pages/splash_page.dart';
import '../features/projects/presentation/pages/projects_page.dart';
import '../features/projects/presentation/pages/project_details_page.dart';
import '../features/proposals/presentation/pages/proposals_page.dart';
import '../features/proposals/presentation/pages/proposal_details_page.dart';
import '../features/messages/presentation/pages/conversations_page.dart';
import '../features/messages/presentation/pages/chat_page.dart';
import '../features/orders/presentation/pages/orders_page.dart';
import '../features/orders/presentation/pages/order_details_page.dart';
import '../features/notifications/presentation/pages/notifications_page.dart';
import '../features/profile/presentation/pages/profile_page.dart';
import '../shared/widgets/main_scaffold.dart';
import '../shared/providers/auth_provider.dart';

/// App route paths
class AppRoutes {
  AppRoutes._();

  static const String splash = '/';
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';
  static const String verifyOtp = '/verify-otp';

  // Main tabs (5 like Upwork)
  static const String projects = '/projects';
  static const String projectDetails = '/projects/:id';
  static const String createProject = '/projects/new';

  static const String proposals = '/proposals';
  static const String proposalDetails = '/proposals/:id';

  static const String orders = '/orders';
  static const String orderDetails = '/orders/:id';

  static const String messages = '/messages';
  static const String chat = '/messages/:id';

  static const String notifications = '/notifications';

  static const String profile = '/profile';
  static const String editProfile = '/profile/edit';
  static const String settings = '/profile/settings';
}

/// Router provider
final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: AppRoutes.splash,
    debugLogDiagnostics: true,
    refreshListenable: authState,
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final isAuthRoute = state.matchedLocation == AppRoutes.login ||
          state.matchedLocation == AppRoutes.register ||
          state.matchedLocation == AppRoutes.forgotPassword ||
          state.matchedLocation == AppRoutes.verifyOtp;
      final isSplash = state.matchedLocation == AppRoutes.splash;

      // If on splash, let it handle navigation
      if (isSplash) return null;

      // If not authenticated and not on auth route, go to login
      if (!isAuthenticated && !isAuthRoute) {
        return AppRoutes.login;
      }

      // If authenticated and on auth route, go to home
      if (isAuthenticated && isAuthRoute) {
        return AppRoutes.projects;
      }

      return null;
    },
    routes: [
      // Splash
      GoRoute(
        path: AppRoutes.splash,
        builder: (context, state) => const SplashPage(),
      ),

      // Auth routes
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: AppRoutes.register,
        builder: (context, state) => const RegisterPage(),
      ),

      // Main app shell with bottom navigation (5 tabs like Upwork)
      ShellRoute(
        builder: (context, state, child) => MainScaffold(child: child),
        routes: [
          // Projects (Jobs in Upwork)
          GoRoute(
            path: AppRoutes.projects,
            builder: (context, state) => const ProjectsPage(),
            routes: [
              GoRoute(
                path: ':id',
                builder: (context, state) {
                  final id = state.pathParameters['id']!;
                  return ProjectDetailsPage(projectId: id);
                },
              ),
            ],
          ),

          // Proposals
          GoRoute(
            path: AppRoutes.proposals,
            builder: (context, state) => const ProposalsPage(),
            routes: [
              GoRoute(
                path: ':id',
                builder: (context, state) {
                  final id = state.pathParameters['id']!;
                  return ProposalDetailsPage(proposalId: id);
                },
              ),
            ],
          ),

          // Orders (Contracts in Upwork)
          GoRoute(
            path: AppRoutes.orders,
            builder: (context, state) => const OrdersPage(),
            routes: [
              GoRoute(
                path: ':id',
                builder: (context, state) {
                  final id = state.pathParameters['id']!;
                  return OrderDetailsPage(orderId: id);
                },
              ),
            ],
          ),

          // Messages
          GoRoute(
            path: AppRoutes.messages,
            builder: (context, state) => const ConversationsPage(),
            routes: [
              GoRoute(
                path: ':id',
                builder: (context, state) {
                  final id = state.pathParameters['id']!;
                  return ChatPage(conversationId: id);
                },
              ),
            ],
          ),

          // Notifications (Alerts in Upwork)
          GoRoute(
            path: AppRoutes.notifications,
            builder: (context, state) => const NotificationsPage(),
          ),

          // Profile
          GoRoute(
            path: AppRoutes.profile,
            builder: (context, state) => const ProfilePage(),
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Page not found: ${state.matchedLocation}'),
      ),
    ),
  );
});
