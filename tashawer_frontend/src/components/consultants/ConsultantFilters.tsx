'use client';

import { useState } from 'react';
import { Input, Button } from '@/components/ui';
import type { ConsultantFilters as Filters, Category, AvailabilityStatus } from '@/types';
import { Search, Filter, X } from 'lucide-react';

interface ConsultantFiltersProps {
  categories: Category[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function ConsultantFilters({
  categories,
  filters,
  onFiltersChange,
}: ConsultantFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchValue, page: 1 });
  };

  const handleFilterChange = (key: keyof Filters, value: string | number | undefined) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  const handleClearFilters = () => {
    setSearchValue('');
    onFiltersChange({ page: 1, page_size: filters.page_size });
  };

  const hasActiveFilters =
    filters.search ||
    filters.city ||
    filters.availability ||
    filters.category ||
    filters.min_rating ||
    filters.min_experience;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search consultants by name or specialization..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">Search</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </form>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <Input
                type="text"
                placeholder="Enter city..."
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
              />
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Availability
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.availability || ''}
                onChange={(e) =>
                  handleFilterChange('availability', (e.target.value as AvailabilityStatus) || undefined)
                }
              >
                <option value="">All</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="not_available">Not Available</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Rating
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.min_rating || ''}
                onChange={(e) =>
                  handleFilterChange('min_rating', e.target.value ? parseFloat(e.target.value) : undefined)
                }
              >
                <option value="">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </div>

            {/* Minimum Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Experience
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.min_experience || ''}
                onChange={(e) =>
                  handleFilterChange('min_experience', e.target.value ? parseInt(e.target.value) : undefined)
                }
              >
                <option value="">Any Experience</option>
                <option value="1">1+ Years</option>
                <option value="3">3+ Years</option>
                <option value="5">5+ Years</option>
                <option value="10">10+ Years</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.ordering || '-rating'}
                onChange={(e) => handleFilterChange('ordering', e.target.value)}
              >
                <option value="-rating">Highest Rating</option>
                <option value="rating">Lowest Rating</option>
                <option value="-experience_years">Most Experience</option>
                <option value="experience_years">Least Experience</option>
                <option value="-total_projects_completed">Most Projects</option>
                <option value="hourly_rate">Lowest Rate</option>
                <option value="-hourly_rate">Highest Rate</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
