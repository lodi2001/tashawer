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
  Input,
  Spinner,
  Alert,
  AlertDescription,
} from '@/components/ui';
import {
  getMyPortfolio,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  uploadPortfolioImages,
} from '@/lib/consultants';
import { getCategories } from '@/lib/projects';
import { handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { ConsultantPortfolio, PortfolioCreateData, Category } from '@/types';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  X,
  Star,
} from 'lucide-react';

export default function PortfolioManagementPage() {
  const { user } = useAuthStore();
  const [portfolio, setPortfolio] = useState<ConsultantPortfolio[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ConsultantPortfolio | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const [formData, setFormData] = useState<PortfolioCreateData>({
    title: '',
    description: '',
    category: '',
    client_name: '',
    project_url: '',
    completion_date: '',
    is_featured: false,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [portfolioData, categoriesData] = await Promise.all([
          getMyPortfolio(),
          getCategories(),
        ]);
        setPortfolio(portfolioData);
        setCategories(categoriesData);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === 'consultant') {
      loadData();
    }
  }, [user]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      client_name: '',
      project_url: '',
      completion_date: '',
      is_featured: false,
    });
    setSelectedImages([]);
    setEditingItem(null);
  };

  const openModal = (item?: ConsultantPortfolio) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        title_ar: item.title_ar || '',
        description: item.description,
        description_ar: item.description_ar || '',
        category: item.category || '',
        client_name: item.client_name || '',
        project_url: item.project_url || '',
        completion_date: item.completion_date || '',
        is_featured: item.is_featured,
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      setError('Title and description are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      let savedItem: ConsultantPortfolio;

      if (editingItem) {
        savedItem = await updatePortfolioItem(editingItem.id, formData);
        setPortfolio(portfolio.map((p) => (p.id === savedItem.id ? savedItem : p)));
      } else {
        savedItem = await createPortfolioItem(formData);
        setPortfolio([savedItem, ...portfolio]);
      }

      // Upload images if any
      if (selectedImages.length > 0) {
        await uploadPortfolioImages(savedItem.id, selectedImages);
        // Reload portfolio to get updated images
        const updatedPortfolio = await getMyPortfolio();
        setPortfolio(updatedPortfolio);
      }

      closeModal();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this portfolio item?')) return;

    try {
      await deletePortfolioItem(id);
      setPortfolio(portfolio.filter((p) => p.id !== id));
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedImages(Array.from(files));
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/consultant/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Portfolio</h1>
              <p className="text-gray-600 mt-1">
                Showcase your best work to potential clients
              </p>
            </div>
          </div>
          <Button onClick={() => openModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Portfolio Grid */}
        {portfolio.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No portfolio items yet
                </h3>
                <p className="mt-2 text-gray-500">
                  Add your first project to showcase your work
                </p>
                <Button className="mt-4" onClick={() => openModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Project
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {portfolio.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                {/* Image */}
                {item.images.length > 0 ? (
                  <img
                    src={item.images.find((img) => img.is_primary)?.image || item.images[0].image}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-brand-yellow/10 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}

                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {item.title}
                        </h3>
                        {item.is_featured && (
                          <Star className="h-4 w-4 text-brand-yellow fill-brand-yellow" />
                        )}
                      </div>
                      {item.category_name && (
                        <p className="text-sm text-gray-500">{item.category_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {item.description}
                  </p>
                  {item.completion_date && (
                    <p className="text-xs text-gray-400 mt-2">
                      Completed: {item.completion_date}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={closeModal}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Project Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formData.category || ''}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Client Name (Optional)"
                      value={formData.client_name || ''}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    />
                    <Input
                      label="Completion Date"
                      type="date"
                      value={formData.completion_date || ''}
                      onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                    />
                  </div>

                  <Input
                    label="Project URL (Optional)"
                    type="url"
                    value={formData.project_url || ''}
                    onChange={(e) => setFormData({ ...formData, project_url: e.target.value })}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Images
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="w-full text-sm"
                    />
                    {selectedImages.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedImages.length} image(s) selected
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    />
                    <label htmlFor="is_featured" className="text-sm text-gray-700">
                      Feature this project (shown first on profile)
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={closeModal}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
