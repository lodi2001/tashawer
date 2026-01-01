'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, Spinner, Alert, AlertDescription } from '@/components/ui';
import { ConsultantCard, ConsultantFilters } from '@/components/consultants';
import { Pagination } from '@/components/projects';
import { getConsultants } from '@/lib/consultants';
import { getCategories } from '@/lib/projects';
import { handleApiError } from '@/lib/api';
import type { ConsultantListItem, Category, ConsultantFilters as Filters } from '@/types';
import { Users } from 'lucide-react';

export default function BrowseConsultantsPage() {
  const [consultants, setConsultants] = useState<ConsultantListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    page_size: 12,
    ordering: '-rating',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 12,
    total_count: 0,
    total_pages: 0,
  });

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadConsultants = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getConsultants(filters);
      setConsultants(response.consultants);
      setPagination(response.pagination);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadConsultants();
  }, [loadConsultants]);

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find Consultants</h1>
          <p className="text-gray-600 mt-1">
            Browse engineering consultants and invite them to your projects
          </p>
        </div>

        {/* Filters */}
        <ConsultantFilters
          categories={categories}
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : consultants.length === 0 ? (
          /* Empty State */
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No consultants found
                </h3>
                <p className="mt-2 text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Consultant Grid */
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {consultants.map((consultant) => (
                <ConsultantCard
                  key={consultant.id}
                  consultant={consultant}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              page={pagination.page}
              totalPages={pagination.total_pages}
              totalCount={pagination.total_count}
              pageSize={pagination.page_size}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
