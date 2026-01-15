'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  AlertTriangle,
  Eye,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  getAdminDisputes,
  assignDisputeAdmin,
  type DisputeFilters,
  type PaginatedDisputeResponse,
} from '@/lib/disputes';
import type { DisputeListItem, DisputeStatus } from '@/types/dispute';
import { getDisputeStatusColor } from '@/types/dispute';

export default function AdminDisputesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';

  // State
  const [disputes, setDisputes] = useState<DisputeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    page: 1,
    pageSize: 10,
  });

  // Filters
  const [filters, setFilters] = useState<DisputeFilters>({
    status: undefined,
    search: undefined,
    page: 1,
    page_size: 10,
  });

  const [searchInput, setSearchInput] = useState('');
  const [assigning, setAssigning] = useState<string | null>(null);

  // Status options
  const statusOptions: { value: string; label: string; labelAr: string }[] = [
    { value: '', label: 'All Statuses', labelAr: 'جميع الحالات' },
    { value: 'open', label: 'Open', labelAr: 'مفتوح' },
    { value: 'under_review', label: 'Under Review', labelAr: 'قيد المراجعة' },
    { value: 'awaiting_response', label: 'Awaiting Response', labelAr: 'في انتظار الرد' },
    { value: 'in_mediation', label: 'In Mediation', labelAr: 'في الوساطة' },
    { value: 'resolved', label: 'Resolved', labelAr: 'تم الحل' },
    { value: 'closed', label: 'Closed', labelAr: 'مغلق' },
    { value: 'escalated', label: 'Escalated', labelAr: 'تم التصعيد' },
  ];

  // Fetch disputes
  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: PaginatedDisputeResponse = await getAdminDisputes(filters);
      setDisputes(response.results);
      setPagination({
        count: response.count,
        next: response.next,
        previous: response.previous,
        page: filters.page || 1,
        pageSize: filters.page_size || 10,
      });
    } catch (err) {
      console.error('Failed to fetch disputes:', err);
      setError(isRTL ? 'فشل في تحميل النزاعات' : 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  }, [filters, isRTL]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  // Handle search
  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: searchInput || undefined,
      page: 1,
    }));
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: status || undefined,
      page: 1,
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  // Assign dispute to self
  const handleAssignToMe = async (disputeNumber: string) => {
    setAssigning(disputeNumber);
    try {
      await assignDisputeAdmin(disputeNumber);
      await fetchDisputes();
    } catch (err) {
      console.error('Failed to assign dispute:', err);
      setError(isRTL ? 'فشل في تعيين النزاع' : 'Failed to assign dispute');
    } finally {
      setAssigning(null);
    }
  };

  // View dispute details
  const handleViewDispute = (disputeNumber: string) => {
    router.push(`/${locale}/admin/disputes/${disputeNumber}`);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format amount
  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(num);
  };

  // Calculate pagination
  const totalPages = Math.ceil(pagination.count / pagination.pageSize);
  const startItem = (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.page * pagination.pageSize, pagination.count);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isRTL ? 'إدارة النزاعات' : 'Disputes Management'}
            </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isRTL
              ? 'مراجعة وحل نزاعات المستخدمين'
              : 'Review and resolve user disputes'}
          </p>
        </div>
        <button
          onClick={fetchDisputes}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {isRTL ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={isRTL ? 'البحث برقم النزاع أو الطلب...' : 'Search by dispute or order number...'}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filters.status || ''}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none bg-white"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {isRTL ? option.labelAr : option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            {isRTL ? 'بحث' : 'Search'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Disputes Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : disputes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <AlertTriangle className="h-12 w-12 mb-4 text-gray-300" />
            <p>{isRTL ? 'لا توجد نزاعات' : 'No disputes found'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'رقم النزاع' : 'Dispute #'}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الطلب' : 'Order'}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الأطراف' : 'Parties'}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'السبب' : 'Reason'}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'المبلغ المتنازع عليه' : 'Disputed Amount'}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الحالة' : 'Status'}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'التاريخ' : 'Date'}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {disputes.map((dispute) => (
                    <tr key={dispute.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-medium text-teal-600">
                          {dispute.dispute_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{dispute.order_number}</p>
                          {dispute.project_title && (
                            <p className="text-gray-500 truncate max-w-[150px]">
                              {dispute.project_title}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <p className="text-gray-900">
                            <span className="text-gray-500">
                              {isRTL ? 'العميل: ' : 'Client: '}
                            </span>
                            {dispute.client_name}
                          </p>
                          <p className="text-gray-900">
                            <span className="text-gray-500">
                              {isRTL ? 'الاستشاري: ' : 'Consultant: '}
                            </span>
                            {dispute.consultant_name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {dispute.reason_display}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {formatAmount(dispute.disputed_amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDisputeStatusColor(
                            dispute.status as DisputeStatus
                          )}`}
                        >
                          {dispute.status_display}
                        </span>
                        {dispute.response_deadline && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
                            <Calendar className="h-3 w-3" />
                            {formatDate(dispute.response_deadline)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(dispute.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDispute(dispute.dispute_number)}
                            className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title={isRTL ? 'عرض التفاصيل' : 'View Details'}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {(dispute.status === 'open' || dispute.status === 'under_review') && (
                            <button
                              onClick={() => handleAssignToMe(dispute.dispute_number)}
                              disabled={assigning === dispute.dispute_number}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                              title={isRTL ? 'تعيين لي' : 'Assign to Me'}
                            >
                              {assigning === dispute.dispute_number ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <UserPlus className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.previous}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRTL ? 'السابق' : 'Previous'}
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.next}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRTL ? 'التالي' : 'Next'}
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      {isRTL ? (
                        <>
                          عرض <span className="font-medium">{startItem}</span> إلى{' '}
                          <span className="font-medium">{endItem}</span> من{' '}
                          <span className="font-medium">{pagination.count}</span> نتيجة
                        </>
                      ) : (
                        <>
                          Showing <span className="font-medium">{startItem}</span> to{' '}
                          <span className="font-medium">{endItem}</span> of{' '}
                          <span className="font-medium">{pagination.count}</span> results
                        </>
                      )}
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.previous}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">{isRTL ? 'السابق' : 'Previous'}</span>
                        {isRTL ? (
                          <ChevronRight className="h-5 w-5" />
                        ) : (
                          <ChevronLeft className="h-5 w-5" />
                        )}
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNum === pagination.page
                                ? 'z-10 bg-teal-50 border-teal-500 text-teal-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.next}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">{isRTL ? 'التالي' : 'Next'}</span>
                        {isRTL ? (
                          <ChevronLeft className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}
