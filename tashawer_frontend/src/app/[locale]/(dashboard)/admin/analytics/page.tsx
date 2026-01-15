'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Spinner, Alert, AlertDescription, SimpleSelect as Select } from '@/components/ui';
import {
  getPlatformOverview,
  getUserGrowth,
  getProjectAnalytics,
  getRevenueAnalytics,
  type PlatformOverview,
  type UserGrowthData,
  type ProjectAnalytics,
  type RevenueAnalytics,
} from '@/lib/analytics';
import { handleApiError } from '@/lib/api';
import {
  Users,
  Briefcase,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData | null>(null);
  const [projectAnalytics, setProjectAnalytics] = useState<ProjectAnalytics | null>(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [days, setDays] = useState(30);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [overviewData, growthData, projectData, revenueData] = await Promise.all([
        getPlatformOverview(),
        getUserGrowth(period, days),
        getProjectAnalytics(days),
        getRevenueAnalytics(period, days),
      ]);

      setOverview(overviewData);
      setUserGrowth(growthData);
      setProjectAnalytics(projectData);
      setRevenueAnalytics(revenueData);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [period, days]);

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const periodOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const daysOptions = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: '365', label: 'Last year' },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Platform performance and insights</p>
          </div>
          <div className="flex gap-3">
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
              options={periodOptions}
              className="w-32"
            />
            <Select
              value={days.toString()}
              onChange={(e) => setDays(parseInt(e.target.value))}
              options={daysOptions}
              className="w-36"
            />
          </div>
        </div>

        {/* Overview Cards */}
        {overview && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{overview.users.total}</p>
                    <p className="text-xs text-green-600 mt-1">
                      +{overview.users.new_last_30_days} last 30 days
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{overview.projects.total}</p>
                    <p className="text-xs text-green-600 mt-1">
                      {overview.projects.completion_rate}% completion rate
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{overview.orders.total}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {overview.orders.active} active
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Platform Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(overview.revenue.total_platform_fees)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      From {formatCurrency(overview.revenue.total_order_value)} total
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Distribution */}
        {overview && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  User Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Clients</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(overview.users.clients / overview.users.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="font-medium w-12 text-right">{overview.users.clients}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Consultants</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{
                            width: `${(overview.users.consultants / overview.users.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="font-medium w-12 text-right">{overview.users.consultants}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Project Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${(overview.projects.active / overview.projects.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="font-medium w-12 text-right">{overview.projects.active}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Completed</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(overview.projects.completed / overview.projects.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="font-medium w-12 text-right">{overview.projects.completed}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Growth Chart */}
        {userGrowth && userGrowth.growth.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                User Growth Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-1">
                {userGrowth.growth.slice(-30).map((item, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-brand-blue rounded-t"
                    style={{
                      height: `${Math.max(
                        (item.total / Math.max(...userGrowth.growth.map((g) => g.total))) * 100,
                        5
                      )}%`,
                    }}
                    title={`${item.date}: ${item.total} new users`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>{userGrowth.growth[0]?.date}</span>
                <span>{userGrowth.growth[userGrowth.growth.length - 1]?.date}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Distribution & Revenue */}
        <div className="grid gap-4 md:grid-cols-2">
          {projectAnalytics && projectAnalytics.category_distribution.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Projects by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projectAnalytics.category_distribution.slice(0, 5).map((cat, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-600 truncate max-w-[150px]">
                        {cat.category__name || 'Uncategorized'}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-brand-blue h-2 rounded-full"
                            style={{
                              width: `${(cat.count / projectAnalytics.category_distribution[0].count) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="font-medium w-8 text-right">{cat.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {revenueAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Total Orders</span>
                    <span className="font-bold text-lg">{revenueAnalytics.summary.total_orders}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Total Value</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(revenueAnalytics.summary.total_value)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Platform Fees</span>
                    <span className="font-bold text-lg text-green-600">
                      {formatCurrency(revenueAnalytics.summary.total_fees)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Avg Order Value</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(revenueAnalytics.summary.average_order_value)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Project Stats */}
        {projectAnalytics && (
          <Card>
            <CardHeader>
              <CardTitle>Project Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-brand-blue">
                    {projectAnalytics.average_proposals_per_project}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Avg Proposals/Project</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-brand-blue">
                    {formatCurrency(projectAnalytics.budget_stats.average_min)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Avg Min Budget</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-brand-blue">
                    {formatCurrency(projectAnalytics.budget_stats.average_max)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Avg Max Budget</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-brand-blue">
                    {formatCurrency(projectAnalytics.budget_stats.total_value)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Total Project Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
