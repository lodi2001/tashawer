'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Spinner,
} from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import {
  Users,
  FileText,
  BarChart3,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
} from 'lucide-react';

interface DashboardStats {
  total_users: number;
  pending_approval: number;
  active_users: number;
  suspended_users: number;
  total_projects: number;
  total_orders: number;
}

export default function AdminDashboardPage() {
  const locale = useLocale();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const localePath = (path: string) => `/${locale}${path}`;

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      // Try to load platform overview stats
      const response = await api.get('/analytics/admin/overview/');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      // If analytics not available, show default stats
      setStats({
        total_users: 0,
        pending_approval: 0,
        active_users: 0,
        suspended_users: 0,
        total_projects: 0,
        total_orders: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Pending Approval',
      value: stats?.pending_approval || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Active Users',
      value: stats?.active_users || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Suspended Users',
      value: stats?.suspended_users || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  const quickLinks = [
    {
      title: 'Manage Users',
      description: 'View and manage all platform users',
      href: '/admin/users',
      icon: Users,
    },
    {
      title: 'Audit Logs',
      description: 'View system activity logs',
      href: '/admin/audit-logs',
      icon: FileText,
    },
    {
      title: 'Analytics',
      description: 'View platform analytics and reports',
      href: '/admin/analytics',
      icon: BarChart3,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.full_name}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={localePath(link.href)}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{link.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {link.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
