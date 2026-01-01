'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Select,
  Alert,
  AlertDescription,
  Spinner,
} from '@/components/ui';
import { getUsers, approveUser, suspendUser, activateUser } from '@/lib/admin';
import { handleApiError } from '@/lib/api';
import type { AdminUserListItem, PaginatedResponse } from '@/types';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  Briefcase,
  Shield,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const userTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'individual', label: 'Individual' },
  { value: 'organization', label: 'Organization' },
  { value: 'consultant', label: 'Consultant' },
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<PaginatedResponse<AdminUserListItem> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [userType, setUserType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadUsers();
  }, [userType, status, page]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUsers({
        user_type: userType || undefined,
        account_status: status || undefined,
        search: search || undefined,
        page,
        page_size: 10,
      });
      setUsers(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleApprove = async (userId: string) => {
    try {
      setActionLoading(userId);
      await approveUser(userId);
      loadUsers();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (userId: string) => {
    try {
      setActionLoading(userId);
      await suspendUser(userId);
      loadUsers();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (userId: string) => {
    try {
      setActionLoading(userId);
      await activateUser(userId);
      loadUsers();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const getUserIcon = (userType: string) => {
    switch (userType) {
      case 'individual':
        return <User className="h-4 w-4" />;
      case 'organization':
        return <Building2 className="h-4 w-4" />;
      case 'consultant':
        return <Briefcase className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (user: AdminUserListItem) => {
    if (user.account_status === 'suspended') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-red/10 text-brand-red">
          <XCircle className="h-3 w-3" />
          Suspended
        </span>
      );
    }

    if (!user.is_verified) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-yellow/20 text-brand-gray">
          <Clock className="h-3 w-3" />
          Unverified
        </span>
      );
    }

    if (!user.is_approved) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-yellow/30 text-brand-gray">
          <Clock className="h-3 w-3" />
          Pending Approval
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-blue/10 text-brand-blue">
        <CheckCircle2 className="h-3 w-3" />
        Active
      </span>
    );
  };

  const totalPages = users ? Math.ceil(users.count / 10) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </form>
              <Select
                options={userTypeOptions}
                value={userType}
                onChange={(e) => {
                  setUserType(e.target.value);
                  setPage(1);
                }}
                className="w-40"
              />
              <Select
                options={statusOptions}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="w-40"
              />
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : users && users.results.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Registered</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.results.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-brand-yellow/5">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{user.full_name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              <p className="text-xs text-gray-400">{user.registration_no}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 capitalize">
                              {getUserIcon(user.user_type)}
                              {user.user_type}
                            </span>
                          </td>
                          <td className="py-3 px-4">{getStatusBadge(user)}</td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              {!user.is_approved && user.is_verified && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(user.id)}
                                  isLoading={actionLoading === user.id}
                                >
                                  Approve
                                </Button>
                              )}
                              {user.account_status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleSuspend(user.id)}
                                  isLoading={actionLoading === user.id}
                                >
                                  Suspend
                                </Button>
                              )}
                              {user.account_status === 'suspended' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleActivate(user.id)}
                                  isLoading={actionLoading === user.id}
                                >
                                  Activate
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Showing {(page - 1) * 10 + 1} to{' '}
                    {Math.min(page * 10, users.count)} of {users.count} users
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No users found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
