'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Spinner,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { getConsultantDashboard, updateAvailabilityStatus } from '@/lib/consultants';
import { handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { ConsultantDashboard, AvailabilityStatus } from '@/types';
import {
  Briefcase,
  Mail,
  FolderOpen,
  Award,
  Star,
  DollarSign,
  Settings,
  ChevronRight,
} from 'lucide-react';

const availabilityOptions: { value: AvailabilityStatus; label: string; color: string }[] = [
  { value: 'available', label: 'Available', color: 'bg-brand-blue/10 text-brand-blue border-brand-blue/30' },
  { value: 'busy', label: 'Busy', color: 'bg-secondary/20 text-brand-gray border-secondary/50' },
  { value: 'not_available', label: 'Not Available', color: 'bg-brand-red/10 text-brand-red border-brand-red/30' },
];

export default function ConsultantDashboardPage() {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<ConsultantDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getConsultantDashboard();
        setDashboard(data);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === 'consultant') {
      loadDashboard();
    }
  }, [user]);

  const handleStatusChange = async (newStatus: AvailabilityStatus) => {
    if (!dashboard || isUpdatingStatus) return;

    try {
      setIsUpdatingStatus(true);
      await updateAvailabilityStatus(newStatus);
      setDashboard({
        ...dashboard,
        profile: {
          ...dashboard.profile,
          availability_status: newStatus,
        },
      });
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (user?.role !== 'consultant') {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>This page is only accessible to consultants.</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !dashboard) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Failed to load dashboard'}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const currentStatus = availabilityOptions.find(
    (opt) => opt.value === dashboard.profile.availability_status
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Consultant Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Manage your profile, portfolio, and track your performance
            </p>
          </div>
          <Link href="/profile">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
        </div>

        {/* Profile Summary & Status */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {dashboard.profile.avatar ? (
                  <img
                    src={dashboard.profile.avatar}
                    alt={dashboard.profile.full_name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-semibold text-primary">
                      {dashboard.profile.full_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {dashboard.profile.full_name}
                  </h2>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span>{(Number(dashboard.profile.rating) || 0).toFixed(1)}</span>
                      <span className="text-gray-400">({dashboard.profile.total_reviews || 0} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      <span>{dashboard.profile.total_projects_completed || 0} projects</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span>{(Number(dashboard.profile.total_earned) || 0).toLocaleString()} SAR earned</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Availability Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Availability Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {availabilityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    disabled={isUpdatingStatus}
                    className={`w-full px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      dashboard.profile.availability_status === option.value
                        ? option.color + ' border-2'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-blue/10 rounded-lg">
                  <Mail className="h-5 w-5 text-brand-blue" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboard.stats.pending_invitations}
                  </p>
                  <p className="text-xs text-gray-500">Pending Invitations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-blue/10 rounded-lg">
                  <Briefcase className="h-5 w-5 text-brand-blue" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboard.stats.active_proposals}
                  </p>
                  <p className="text-xs text-gray-500">Active Proposals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-yellow/20 rounded-lg">
                  <FolderOpen className="h-5 w-5 text-brand-gray" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboard.stats.portfolio_items}
                  </p>
                  <p className="text-xs text-gray-500">Portfolio Items</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-yellow/20 rounded-lg">
                  <Star className="h-5 w-5 text-brand-yellow" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboard.stats.skills}
                  </p>
                  <p className="text-xs text-gray-500">Skills</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-red/10 rounded-lg">
                  <Award className="h-5 w-5 text-brand-red" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboard.stats.certifications}
                  </p>
                  <p className="text-xs text-gray-500">Certifications</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/consultant/invitations">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-brand-blue" />
                  <span className="font-medium">View Invitations</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/consultant/portfolio">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-5 w-5 text-brand-blue" />
                  <span className="font-medium">Manage Portfolio</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/consultant/skills">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-brand-blue" />
                  <span className="font-medium">Manage Skills</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/consultant/certifications">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-brand-blue" />
                  <span className="font-medium">Manage Certifications</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>Activity feed coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
