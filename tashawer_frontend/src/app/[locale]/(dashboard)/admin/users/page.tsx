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
  Alert,
  AlertDescription,
  Spinner,
} from '@/components/ui';
import api, { handleApiError } from '@/lib/api';
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserCheck,
  UserX,
  RefreshCw,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  mobile: string;
  role: string;
  user_type: string;
  registration_no: string;
  is_verified: boolean;
  is_approved: boolean;
  account_status: string;
  full_name: string;
  created_at: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    loadUsers();
  }, [page, statusFilter, roleFilter]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let url = `/auth/admin/users/?page=${page}&page_size=${pageSize}`;
      if (statusFilter !== 'all') {
        url += `&account_status=${statusFilter}`;
      }
      if (roleFilter !== 'all') {
        url += `&role=${roleFilter}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const response = await api.get<{ success: boolean; data: PaginatedResponse }>(url);
      if (response.data.success) {
        setUsers(response.data.data.results);
        setTotalCount(response.data.data.count);
      }
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
      await api.post(`/auth/admin/users/${userId}/approve/`);
      setSuccess('User approved successfully');
      setTimeout(() => setSuccess(null), 3000);
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
      await api.post(`/auth/admin/users/${userId}/suspend/`);
      setSuccess('User suspended successfully');
      setTimeout(() => setSuccess(null), 3000);
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
      await api.post(`/auth/admin/users/${userId}/activate/`);
      setSuccess('User activated successfully');
      setTimeout(() => setSuccess(null), 3000);
      loadUsers();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (user: User) => {
    if (!user.is_verified) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          <Clock className="h-3 w-3" />
          Unverified
        </span>
      );
    }
    if (!user.is_approved) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      );
    }
    if (user.account_status === 'suspended') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <XCircle className="h-3 w-3" />
          Suspended
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle className="h-3 w-3" />
        Active
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700',
      client: 'bg-blue-100 text-blue-700',
      consultant: 'bg-teal-100 text-teal-700',
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-700'}`}>
        {role}
      </span>
    );
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              User Management
            </h1>
            <p className="text-muted-foreground">
              Manage platform users and their permissions
            </p>
          </div>
          <Button variant="outline" onClick={loadUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert variant="success">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email, name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                className="px-3 py-2 border rounded-md"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
              <select
                className="px-3 py-2 border rounded-md"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Roles</option>
                <option value="client">Client</option>
                <option value="consultant">Consultant</option>
                <option value="admin">Admin</option>
              </select>
              <Button type="submit">Search</Button>
            </form>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No users found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Joined</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{user.full_name || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-xs text-muted-foreground">{user.registration_no}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm capitalize">{user.user_type}</span>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(user)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {!user.is_approved && user.is_verified && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApprove(user.id)}
                                disabled={actionLoading === user.id}
                              >
                                {actionLoading === user.id ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Approve
                                  </>
                                )}
                              </Button>
                            )}
                            {user.account_status === 'active' && user.role !== 'admin' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleSuspend(user.id)}
                                disabled={actionLoading === user.id}
                              >
                                {actionLoading === user.id ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <>
                                    <UserX className="h-4 w-4 mr-1" />
                                    Suspend
                                  </>
                                )}
                              </Button>
                            )}
                            {user.account_status === 'suspended' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleActivate(user.id)}
                                disabled={actionLoading === user.id}
                              >
                                {actionLoading === user.id ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Activate
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} users
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
