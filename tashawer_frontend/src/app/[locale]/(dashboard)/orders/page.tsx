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
import { getOrders, getOrderStatusColor, getOrderStatusLabel } from '@/lib/orders';
import { handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { OrderListItem, OrderStatus } from '@/types';
import {
  FileText,
  Calendar,
  DollarSign,
  User,
  Filter,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';

const statusOptions: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'All Orders' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'revision_requested', label: 'Revision Requested' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function OrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [roleFilter, setRoleFilter] = useState<'client' | 'consultant' | ''>('');
  const [totalCount, setTotalCount] = useState(0);

  const isConsultant = user?.role === 'consultant';

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getOrders({
          status: statusFilter || undefined,
          role: roleFilter || undefined,
        });
        setOrders(data.results);
        setTotalCount(data.count);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };
    loadOrders();
  }, [statusFilter, roleFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-500">
              Manage your work orders and track progress
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {!isConsultant && (
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as 'client' | 'consultant' | '')}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                >
                  <option value="">All Roles</option>
                  <option value="client">As Client</option>
                  <option value="consultant">As Consultant</option>
                </select>
              )}

              <span className="text-sm text-gray-500">
                {totalCount} order{totalCount !== 1 ? 's' : ''} found
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && orders.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No orders found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {statusFilter
                  ? 'Try changing the filter to see more orders.'
                  : 'Orders will appear here once you have accepted proposals.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {!isLoading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} currentUserId={user?.id} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

interface OrderCardProps {
  order: OrderListItem;
  currentUserId?: string;
}

function OrderCard({ order, currentUserId }: OrderCardProps) {
  const isClient = order.client.id === currentUserId;
  const otherParty = isClient ? order.consultant : order.client;

  return (
    <Link href={`/orders/${order.order_number}`}>
      <Card className="transition-shadow hover:shadow-md cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              {/* Order Number & Status */}
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-gray-500">
                  #{order.order_number}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getOrderStatusColor(
                    order.status
                  )}`}
                >
                  {getOrderStatusLabel(order.status)}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {isClient ? 'As Client' : 'As Consultant'}
                </span>
              </div>

              {/* Project Title */}
              <h3 className="text-lg font-semibold text-gray-900">
                {order.project.title}
              </h3>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{otherParty.full_name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span>SAR {order.total_amount}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    {format(new Date(order.expected_delivery_date), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-brand-blue h-2 rounded-full transition-all"
                      style={{ width: `${order.progress_percentage}%` }}
                    />
                  </div>
                  <span className="text-xs">{order.progress_percentage}%</span>
                </div>
              </div>
            </div>

            <ChevronRight className="h-5 w-5 text-gray-400 mt-2" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
