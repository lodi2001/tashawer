'use client';

import { useState, useEffect } from 'react';
import { Input, Button, SimpleSelect as Select } from '@/components/ui';
import type { Category, ProjectFilters as Filters, ProjectStatus } from '@/types';
import { Search, X, Filter } from 'lucide-react';

interface ProjectFiltersProps {
  categories: Category[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  showStatusFilter?: boolean;
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function ProjectFilters({
  categories,
  filters,
  onFiltersChange,
  showStatusFilter = false,
}: ProjectFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: localSearch, page: 1 });
  };

  const handleCategoryChange = (value: string) => {
    onFiltersChange({ ...filters, category: value || undefined, page: 1 });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: (value as ProjectStatus) || undefined, page: 1 });
  };

  const handleBudgetChange = (field: 'budget_min' | 'budget_max', value: string) => {
    const numValue = value ? parseInt(value) : undefined;
    onFiltersChange({ ...filters, [field]: numValue, page: 1 });
  };

  const clearFilters = () => {
    setLocalSearch('');
    onFiltersChange({ page: 1, page_size: filters.page_size });
  };

  const hasActiveFilters =
    filters.category ||
    filters.status ||
    filters.budget_min ||
    filters.budget_max ||
    filters.search;

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
    })),
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search projects..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="default">
          Search
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </form>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="p-4 bg-brand-yellow/10 rounded-lg border border-brand-yellow/30 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <Select
                value={filters.category || ''}
                onChange={(e) => handleCategoryChange(e.target.value)}
                options={categoryOptions}
              />
            </div>

            {showStatusFilter && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  value={filters.status || ''}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  options={statusOptions}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Budget (SAR)
              </label>
              <Input
                type="number"
                placeholder="0"
                min={0}
                value={filters.budget_min || ''}
                onChange={(e) => handleBudgetChange('budget_min', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Budget (SAR)
              </label>
              <Input
                type="number"
                placeholder="1,000,000"
                min={0}
                value={filters.budget_max || ''}
                onChange={(e) => handleBudgetChange('budget_max', e.target.value)}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && !showAdvanced && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-full">
              Search: {filters.search}
              <button
                onClick={() => onFiltersChange({ ...filters, search: undefined, page: 1 })}
                className="hover:text-primary/70"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.category && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-full">
              {categories.find((c) => c.id === filters.category)?.name || 'Category'}
              <button
                onClick={() => onFiltersChange({ ...filters, category: undefined, page: 1 })}
                className="hover:text-primary/70"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
