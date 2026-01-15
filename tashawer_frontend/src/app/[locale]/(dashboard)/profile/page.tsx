'use client';

import { useState, useEffect, useRef } from 'react';
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
import { updateProfile, uploadAvatar, deleteAvatar } from '@/lib/auth';
import { handleApiError } from '@/lib/api';
import type { IndividualProfile, OrganizationProfile, ConsultantProfile } from '@/types';
import { User, Building2, Briefcase, CheckCircle2, Clock, XCircle, Camera, Trash2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, setProfile, fetchProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      initFormData();
      // Set avatar URL from profile
      const p = profile as any;
      setAvatarUrl(p.avatar || p.logo || null);
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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select an image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      setError(null);
      const result = await uploadAvatar(file);
      setAvatarUrl(result.avatar_url);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!avatarUrl) return;

    try {
      setIsUploadingAvatar(true);
      setError(null);
      await deleteAvatar();
      setAvatarUrl(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const getStatusBadge = () => {
    if (!user) return null;

    if (!user.is_verified) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-brand-yellow/20 text-brand-gray">
          <Clock className="h-3 w-3" />
          Pending Verification
        </span>
      );
    }

    if (!user.is_approved) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-brand-yellow/30 text-brand-gray">
          <Clock className="h-3 w-3" />
          Pending Approval
        </span>
      );
    }

    if (user.account_status === 'suspended') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-brand-red/10 text-brand-red">
          <XCircle className="h-3 w-3" />
          Suspended
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-brand-blue/10 text-brand-blue">
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
                {/* Avatar Upload Section */}
                <div className="relative group">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                  />
                  <div
                    onClick={handleAvatarClick}
                    className="relative h-16 w-16 rounded-full cursor-pointer overflow-hidden border-2 border-brand-blue/20 hover:border-brand-blue/50 transition-colors"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-blue/10 text-brand-blue">
                        {getIcon()}
                      </div>
                    )}
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      {isUploadingAvatar ? (
                        <Spinner size="sm" className="text-white" />
                      ) : (
                        <Camera className="h-5 w-5 text-white" />
                      )}
                    </div>
                  </div>
                  {/* Delete Button */}
                  {avatarUrl && !isUploadingAvatar && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAvatar();
                      }}
                      className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                      title="Remove photo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div>
                  <CardTitle>Profile Settings</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage your account information
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Click the photo to change
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
              <div className="grid grid-cols-2 gap-4 p-4 bg-brand-yellow/10 rounded-lg border border-brand-yellow/30 mb-6">
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
