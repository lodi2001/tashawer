'use client';

import { Select } from '@/components/ui';
import type { Category } from '@/types';

interface CategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export function CategorySelect({
  categories,
  value,
  onChange,
  error,
  required = false,
}: CategorySelectProps) {
  const options = [
    { value: '', label: 'Select a category...' },
    ...categories.map((cat) => ({
      value: cat.id,
      label: `${cat.name} - ${cat.name_ar}`,
    })),
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Category {required && <span className="text-red-500">*</span>}
      </label>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={options}
        error={error}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
