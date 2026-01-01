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
  getMyCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
} from '@/lib/consultants';
import { handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { ConsultantCertification, CertificationCreateData } from '@/types';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Award,
  X,
  CheckCircle,
  Clock,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';

export default function CertificationsManagementPage() {
  const { user } = useAuthStore();
  const [certifications, setCertifications] = useState<ConsultantCertification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<ConsultantCertification | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<Omit<CertificationCreateData, 'document'>>({
    name: '',
    name_ar: '',
    issuing_organization: '',
    credential_id: '',
    credential_url: '',
    issue_date: '',
    expiry_date: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await getMyCertifications();
        setCertifications(data);
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
      issuing_organization: '',
      credential_id: '',
      credential_url: '',
      issue_date: '',
      expiry_date: '',
    });
    setSelectedFile(null);
    setEditingCert(null);
  };

  const openModal = (cert?: ConsultantCertification) => {
    if (cert) {
      setEditingCert(cert);
      setFormData({
        name: cert.name,
        name_ar: cert.name_ar || '',
        issuing_organization: cert.issuing_organization,
        credential_id: cert.credential_id || '',
        credential_url: cert.credential_url || '',
        issue_date: cert.issue_date,
        expiry_date: cert.expiry_date || '',
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
    if (!formData.name || !formData.issuing_organization || !formData.issue_date) {
      setError('Name, issuing organization, and issue date are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const data: CertificationCreateData = {
        ...formData,
        document: selectedFile || undefined,
      };

      if (editingCert) {
        const updated = await updateCertification(editingCert.id, data);
        setCertifications(certifications.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await createCertification(data);
        setCertifications([...certifications, created]);
      }

      closeModal();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this certification?')) return;

    try {
      await deleteCertification(id);
      setCertifications(certifications.filter((c) => c.id !== id));
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
              <h1 className="text-2xl font-bold text-gray-900">My Certifications</h1>
              <p className="text-gray-600 mt-1">
                Add and manage your professional certifications
              </p>
            </div>
          </div>
          <Button onClick={() => openModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Certification
          </Button>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Certifications List */}
        {certifications.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Award className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No certifications added yet
                </h3>
                <p className="mt-2 text-gray-500">
                  Add your certifications to build credibility
                </p>
                <Button className="mt-4" onClick={() => openModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Certification
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {certifications.map((cert) => (
              <Card key={cert.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Award className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                          {cert.is_verified ? (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <Clock className="h-4 w-4 text-secondary" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{cert.issuing_organization}</p>

                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>Issued {format(new Date(cert.issue_date), 'MMM yyyy')}</span>
                          {cert.expiry_date && (
                            <span
                              className={
                                cert.is_expired ? 'text-destructive' : 'text-primary'
                              }
                            >
                              {cert.is_expired
                                ? `Expired ${format(new Date(cert.expiry_date), 'MMM yyyy')}`
                                : `Valid until ${format(new Date(cert.expiry_date), 'MMM yyyy')}`}
                            </span>
                          )}
                        </div>

                        {cert.credential_id && (
                          <p className="text-xs text-gray-400 mt-1">
                            ID: {cert.credential_id}
                          </p>
                        )}

                        {cert.credential_url && (
                          <a
                            href={cert.credential_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Credential
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openModal(cert)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(cert.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {editingCert ? 'Edit Certification' : 'Add Certification'}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={closeModal}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Certification Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., PMP, PE License"
                    required
                  />

                  <Input
                    label="Certification Name (Arabic)"
                    value={formData.name_ar || ''}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder="Optional"
                  />

                  <Input
                    label="Issuing Organization"
                    value={formData.issuing_organization}
                    onChange={(e) =>
                      setFormData({ ...formData, issuing_organization: e.target.value })
                    }
                    placeholder="e.g., PMI, Saudi Council of Engineers"
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Issue Date"
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      required
                    />
                    <Input
                      label="Expiry Date (Optional)"
                      type="date"
                      value={formData.expiry_date || ''}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    />
                  </div>

                  <Input
                    label="Credential ID (Optional)"
                    value={formData.credential_id || ''}
                    onChange={(e) => setFormData({ ...formData, credential_id: e.target.value })}
                    placeholder="e.g., 12345678"
                  />

                  <Input
                    label="Credential URL (Optional)"
                    type="url"
                    value={formData.credential_url || ''}
                    onChange={(e) => setFormData({ ...formData, credential_url: e.target.value })}
                    placeholder="https://..."
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Certificate Document (Optional)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Accepted formats: PDF, JPG, PNG
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={closeModal}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : editingCert ? 'Update' : 'Add'}
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
