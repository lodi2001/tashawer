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
import { getMySkills, createSkill, updateSkill, deleteSkill } from '@/lib/consultants';
import { getCategories } from '@/lib/projects';
import { handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { ConsultantSkill, SkillCreateData, Category, ProficiencyLevel } from '@/types';
import { ArrowLeft, Plus, Pencil, Trash2, Star, X, CheckCircle } from 'lucide-react';

const proficiencyOptions: { value: ProficiencyLevel; label: string; color: string }[] = [
  { value: 'beginner', label: 'Beginner', color: 'bg-muted text-muted-foreground' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-primary/10 text-primary' },
  { value: 'advanced', label: 'Advanced', color: 'bg-secondary/20 text-brand-gray' },
  { value: 'expert', label: 'Expert', color: 'bg-primary/10 text-primary' },
];

export default function SkillsManagementPage() {
  const { user } = useAuthStore();
  const [skills, setSkills] = useState<ConsultantSkill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<ConsultantSkill | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<SkillCreateData>({
    name: '',
    name_ar: '',
    category: '',
    proficiency: 'intermediate',
    years_experience: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [skillsData, categoriesData] = await Promise.all([
          getMySkills(),
          getCategories(),
        ]);
        setSkills(skillsData);
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
      name: '',
      name_ar: '',
      category: '',
      proficiency: 'intermediate',
      years_experience: 0,
    });
    setEditingSkill(null);
  };

  const openModal = (skill?: ConsultantSkill) => {
    if (skill) {
      setEditingSkill(skill);
      setFormData({
        name: skill.name,
        name_ar: skill.name_ar || '',
        category: skill.category || '',
        proficiency: skill.proficiency,
        years_experience: skill.years_experience,
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
    if (!formData.name) {
      setError('Skill name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (editingSkill) {
        const updated = await updateSkill(editingSkill.id, formData);
        setSkills(skills.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const created = await createSkill(formData);
        setSkills([...skills, created]);
      }

      closeModal();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;

    try {
      await deleteSkill(id);
      setSkills(skills.filter((s) => s.id !== id));
    } catch (err) {
      setError(handleApiError(err));
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
              <h1 className="text-2xl font-bold text-gray-900">My Skills</h1>
              <p className="text-gray-600 mt-1">
                Add and manage your professional skills
              </p>
            </div>
          </div>
          <Button onClick={() => openModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Skill
          </Button>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Skills List */}
        {skills.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Star className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No skills added yet
                </h3>
                <p className="mt-2 text-gray-500">
                  Add your skills to help clients find you
                </p>
                <Button className="mt-4" onClick={() => openModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Skill
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {skills.map((skill) => {
                  const proficiency = proficiencyOptions.find(
                    (p) => p.value === skill.proficiency
                  );
                  return (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{skill.name}</h3>
                            {skill.is_verified && (
                              <CheckCircle className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          {skill.category_name && (
                            <p className="text-sm text-gray-500">{skill.category_name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${proficiency?.color}`}
                        >
                          {proficiency?.label}
                        </span>
                        <span className="text-sm text-gray-500">
                          {skill.years_experience} years
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openModal(skill)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(skill.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{editingSkill ? 'Edit Skill' : 'Add Skill'}</CardTitle>
                <Button variant="ghost" size="sm" onClick={closeModal}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Skill Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., AutoCAD, Structural Design"
                    required
                  />

                  <Input
                    label="Skill Name (Arabic)"
                    value={formData.name_ar || ''}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder="Optional"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Related Category
                    </label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formData.category || ''}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">Select Category (Optional)</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proficiency Level
                    </label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formData.proficiency}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          proficiency: e.target.value as ProficiencyLevel,
                        })
                      }
                    >
                      {proficiencyOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Years of Experience"
                    type="number"
                    min={0}
                    value={formData.years_experience || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        years_experience: parseInt(e.target.value) || 0,
                      })
                    }
                  />

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={closeModal}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : editingSkill ? 'Update' : 'Add'}
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
