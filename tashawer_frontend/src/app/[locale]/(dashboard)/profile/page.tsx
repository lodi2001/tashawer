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
import { useAuthStore } from '@/store/authStore';
import { updateProfile } from '@/lib/auth';
import { handleApiError } from '@/lib/api';
import type { IndividualProfile, OrganizationProfile, ConsultantProfile } from '@/types';
import { User, Building2, Briefcase, CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, setProfile, fetchProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      initFormData();
    }
  }, [profile, user?.role, user?.user_type]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      await fetchProfile();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const initFormData = () => {
    if (!profile || !user) return;

    // For consultants, check role; for clients, check user_type
    if (user.role === 'consultant') {
      const p = profile as ConsultantProfile;
      setFormData({
        full_name: p.full_name || '',
        specialization: p.specialization || '',
        experience_years: p.experience_years || 0,
        hourly_rate: p.hourly_rate ? parseFloat(p.hourly_rate) : 0,
        city: p.city || '',
        bio: p.bio || '',
      });
    } else if (user.user_type === 'individual') {
      const p = profile as IndividualProfile;
      setFormData({
        full_name: p.full_name || '',
        national_id: p.national_id || '',
        city: p.city || '',
        address: p.address || '',
        bio: p.bio || '',
      });
    } else if (user.user_type === 'organization') {
      const p = profile as OrganizationProfile;
      setFormData({
        company_name: p.company_name || '',
        representative_name: p.representative_name || '',
        representative_position: p.representative_position || '',
        city: p.city || '',
        address: p.address || '',
      });
    }
    setIsDirty(false);
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(false);
      const updatedProfile = await updateProfile(formData);
      setProfile(updatedProfile);
      setIsDirty(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = () => {
    if (!user) return null;

    if (!user.is_verified) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3" />
          Pending Verification
        </span>
      );
    }

    if (!user.is_approved) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <Clock className="h-3 w-3" />
          Pending Approval
        </span>
      );
    }

    if (user.account_status === 'suspended') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="h-3 w-3" />
          Suspended
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
        <CheckCircle2 className="h-3 w-3" />
        Active
      </span>
    );
  };

  const getIcon = () => {
    // Check role first for consultant
    if (user?.role === 'consultant') {
      return <Briefcase className="h-6 w-6" />;
    }
    // Then check user_type for individual/organization
    switch (user?.user_type) {
      case 'individual':
        return <User className="h-6 w-6" />;
      case 'organization':
        return <Building2 className="h-6 w-6" />;
      default:
        return <User className="h-6 w-6" />;
    }
  };

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
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {getIcon()}
                </div>
                <div>
                  <CardTitle>Profile Settings</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage your account information
                  </p>
                </div>
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="success" className="mb-6">
                <AlertDescription>Profile updated successfully!</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account Info (readonly) */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg mb-6">
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium">{user?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Mobile</p>
                  <p className="text-sm font-medium">{user?.mobile || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Registration No.</p>
                  <p className="text-sm font-medium">{user?.registration_no}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Account Type</p>
                  <p className="text-sm font-medium capitalize">{user?.user_type}</p>
                </div>
              </div>

              {/* Individual Client Fields */}
              {user?.role === 'client' && user?.user_type === 'individual' && (
                <>
                  <Input
                    label="Full Name"
                    value={formData.full_name as string || ''}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                  />
                  <Input
                    label="National ID"
                    value={formData.national_id as string || ''}
                    onChange={(e) => handleChange('national_id', e.target.value)}
                  />
                  <Input
                    label="City"
                    value={formData.city as string || ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                  <Input
                    label="Address"
                    value={formData.address as string || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bio</label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formData.bio as string || ''}
                      onChange={(e) => handleChange('bio', e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Organization Client Fields */}
              {user?.role === 'client' && user?.user_type === 'organization' && (
                <>
                  <Input
                    label="Company Name"
                    value={formData.company_name as string || ''}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                  />
                  <Input
                    label="Representative Name"
                    value={formData.representative_name as string || ''}
                    onChange={(e) => handleChange('representative_name', e.target.value)}
                  />
                  <Input
                    label="Position"
                    value={formData.representative_position as string || ''}
                    onChange={(e) => handleChange('representative_position', e.target.value)}
                  />
                  <Input
                    label="City"
                    value={formData.city as string || ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                  <Input
                    label="Address"
                    value={formData.address as string || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                </>
              )}

              {/* Consultant Fields */}
              {user?.role === 'consultant' && (
                <>
                  <Input
                    label="Full Name"
                    value={formData.full_name as string || ''}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                  />
                  <Input
                    label="Specialization"
                    value={formData.specialization as string || ''}
                    onChange={(e) => handleChange('specialization', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Experience (Years)"
                      type="number"
                      min={0}
                      value={formData.experience_years as number || 0}
                      onChange={(e) => handleChange('experience_years', parseInt(e.target.value) || 0)}
                    />
                    <Input
                      label="Hourly Rate (SAR)"
                      type="number"
                      min={0}
                      value={formData.hourly_rate as number || 0}
                      onChange={(e) => handleChange('hourly_rate', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <Input
                    label="City"
                    value={formData.city as string || ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bio</label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formData.bio as string || ''}
                      onChange={(e) => handleChange('bio', e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={initFormData}
                  disabled={!isDirty}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSaving} disabled={!isDirty}>
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
