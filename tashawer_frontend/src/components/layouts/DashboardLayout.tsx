'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { PageLoader, Button } from '@/components/ui';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { NotificationBell } from '@/components/NotificationBell';
import {
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Users,
  FileText,
  FolderOpen,
  Search,
  PlusCircle,
  Send,
  MessageSquare,
  Wallet,
  Star,
  LayoutDashboard,
  Briefcase,
  Award,
  Wrench,
  Mail,
  UserSearch,
  ShoppingBag,
  AlertTriangle,
  Bell,
  BarChart3,
  CreditCard,
  Building2,
} from 'lucide-react';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');
  const isRTL = locale === 'ar';
  const { user, isAuthenticated, isLoading, hasHydrated, fetchProfile, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Helper to prefix paths with locale
  const localePath = (path: string) => `/${locale}${path}`;

  useEffect(() => {
    // Only fetch profile after hydration and if not authenticated
    if (hasHydrated && !isAuthenticated) {
      fetchProfile();
    }
  }, [hasHydrated, isAuthenticated, fetchProfile]);

  useEffect(() => {
    // Only redirect after hydration is complete
    if (hasHydrated && !isLoading && !isAuthenticated) {
      router.push(localePath('/login'));
    }
  }, [hasHydrated, isLoading, isAuthenticated, router, locale]);

  const handleLogout = async () => {
    await logout();
    router.push(localePath('/login'));
  };

  // Show loader while hydrating or loading or not authenticated
  if (!hasHydrated || isLoading || !isAuthenticated) {
    return <PageLoader />;
  }

  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';
  const isConsultant = user?.role === 'consultant';

  const navigation = isAdmin
    ? [
        { name: t('dashboard'), href: '/admin', icon: Home },
        { name: t('users'), href: '/admin/users', icon: Users },
        { name: t('analytics'), href: '/admin/analytics', icon: BarChart3 },
        { name: t('withdrawals'), href: '/admin/withdrawals', icon: CreditCard },
        { name: t('disputes'), href: '/admin/disputes', icon: AlertTriangle },
        { name: t('bankAccounts'), href: '/admin/bank-accounts', icon: Building2 },
        { name: t('auditLogs'), href: '/admin/audit-logs', icon: FileText },
      ]
    : isClient
    ? [
        { name: t('myProjects'), href: '/projects/my', icon: FolderOpen },
        { name: t('newProject'), href: '/projects/new', icon: PlusCircle },
        { name: t('orders'), href: '/orders', icon: ShoppingBag },
        { name: t('disputes'), href: '/disputes', icon: AlertTriangle },
        { name: t('findConsultants'), href: '/consultants', icon: UserSearch },
        { name: t('messages'), href: '/messages', icon: MessageSquare },
        { name: t('notifications'), href: '/notifications', icon: Bell },
        { name: t('payments'), href: '/payments/escrow', icon: Wallet },
        { name: t('reviews'), href: '/reviews/my', icon: Star },
        { name: t('profile'), href: '/profile', icon: User },
      ]
    : isConsultant
    ? [
        { name: t('dashboard'), href: '/consultant/dashboard', icon: LayoutDashboard },
        { name: t('browseProjects'), href: '/projects/browse', icon: Search },
        { name: t('myProposals'), href: '/proposals/my', icon: Send },
        { name: t('orders'), href: '/orders', icon: ShoppingBag },
        { name: t('disputes'), href: '/disputes', icon: AlertTriangle },
        { name: t('invitations'), href: '/consultant/invitations', icon: Mail },
        { name: t('messages'), href: '/messages', icon: MessageSquare },
        { name: t('notifications'), href: '/notifications', icon: Bell },
        { name: t('portfolio'), href: '/consultant/portfolio', icon: Briefcase },
        { name: t('skills'), href: '/consultant/skills', icon: Wrench },
        { name: t('certifications'), href: '/consultant/certifications', icon: Award },
        { name: t('payments'), href: '/payments/transactions', icon: Wallet },
        { name: t('reviews'), href: '/reviews/received', icon: Star },
        { name: t('profile'), href: '/profile', icon: User },
      ]
    : [
        { name: t('profile'), href: '/profile', icon: User },
        { name: t('settings'), href: '/settings', icon: Settings },
      ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar fixed inset-y-0 z-50 w-64 bg-card shadow-lg transform transition-transform duration-300 flex flex-col
          ${isRTL ? 'right-0 left-auto' : 'left-0'}
          ${isRTL
            ? (sidebarOpen ? 'translate-x-0' : 'translate-x-full')
            : (sidebarOpen ? 'translate-x-0' : '-translate-x-full')
          }
          lg:translate-x-0`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b flex-shrink-0">
          <Link href={localePath('/')} className="flex items-center">
            <Image
              src="/images/Tashawer_Logo_Final.png"
              alt={tCommon('appName')}
              width={120}
              height={40}
              className="h-8 w-auto"
            />
          </Link>
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation - scrollable */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={localePath(item.href)}
                className="flex items-center gap-3 px-4 py-3 text-foreground/80 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section - fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t bg-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold flex-shrink-0">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.full_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span>{tAuth('logout')}</span>
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className={isRTL ? 'lg:pr-64' : 'lg:pl-64'}>
        {/* Top bar */}
        <header className={`sticky top-0 z-30 flex h-16 items-center gap-4 bg-card border-b px-4 lg:px-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1" />
          <NotificationBell />
          <LanguageSwitcher />
          <span className="text-sm text-muted-foreground capitalize">
            {user?.user_type}
          </span>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
