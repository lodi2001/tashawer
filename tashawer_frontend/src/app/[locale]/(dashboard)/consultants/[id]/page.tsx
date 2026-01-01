'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Spinner,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { StarRating } from '@/components/reviews';
import { InviteConsultantModal } from '@/components/consultants';
import { getConsultantProfile } from '@/lib/consultants';
import { handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { ConsultantPublicProfile } from '@/types';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Clock,
  Award,
  Mail,
  Globe,
  Calendar,
  CheckCircle,
  Image as ImageIcon,
  UserPlus,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const availabilityColors = {
  available: 'bg-primary/10 text-primary',
  busy: 'bg-secondary/20 text-brand-gray',
  not_available: 'bg-destructive/10 text-destructive',
};

const availabilityLabels = {
  available: 'Available',
  busy: 'Busy',
  not_available: 'Not Available',
};

const proficiencyColors = {
  beginner: 'bg-muted text-muted-foreground',
  intermediate: 'bg-primary/10 text-primary',
  advanced: 'bg-secondary/20 text-brand-gray',
  expert: 'bg-primary/10 text-primary',
};

export default function ConsultantProfilePage() {
  const params = useParams();
  const consultantId = params.id as string;
  const { user } = useAuthStore();

  const [consultant, setConsultant] = useState<ConsultantPublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const isClient = user?.role === 'client';

  const loadConsultant = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getConsultantProfile(consultantId);
      setConsultant(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [consultantId]);

  useEffect(() => {
    loadConsultant();
  }, [loadConsultant]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !consultant) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Consultant not found'}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/consultants">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Consultants
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Button */}
        <Link
          href="/consultants"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Consultants
        </Link>

        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {consultant.avatar ? (
                  <img
                    src={consultant.avatar}
                    alt={consultant.full_name}
                    className="h-32 w-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-4xl font-semibold text-primary">
                      {consultant.full_name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {consultant.full_name}
                    </h1>
                    {consultant.specialization && (
                      <p className="text-lg text-gray-600 mt-1">
                        {consultant.specialization}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          availabilityColors[consultant.availability_status]
                        }`}
                      >
                        {availabilityLabels[consultant.availability_status]}
                      </span>
                      <span className="text-sm text-gray-500">
                        {consultant.consultant_type === 'individual'
                          ? 'Individual Consultant'
                          : 'Consulting Office'}
                      </span>
                    </div>
                  </div>

                  {/* Contact & Invite Buttons */}
                  {isClient && (
                    <div className="flex gap-2">
                      <Link href={`/messages?consultant=${consultant.user_id}`}>
                        <Button variant="outline">
                          <Mail className="h-4 w-4 mr-2" />
                          Contact
                        </Button>
                      </Link>
                      <Button onClick={() => setShowInviteModal(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite to Project
                      </Button>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <StarRating rating={consultant.rating} readonly size="sm" />
                    <span className="text-sm text-gray-600">
                      ({consultant.total_reviews} reviews)
                    </span>
                  </div>
                  {consultant.city && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{consultant.city}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Briefcase className="h-4 w-4" />
                    <span>{consultant.total_projects_completed} projects</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{consultant.experience_years} years exp</span>
                  </div>
                </div>

                {/* Rate and Links */}
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  {consultant.hourly_rate && (
                    <span className="text-lg font-semibold text-primary">
                      {consultant.hourly_rate} SAR/hr
                    </span>
                  )}
                  {consultant.portfolio_url && (
                    <a
                      href={consultant.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Portfolio Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        {consultant.bio && (
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 whitespace-pre-wrap">{consultant.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Skills */}
        {consultant.skill_items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {consultant.skill_items.map((skill) => (
                  <div
                    key={skill.id}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      proficiencyColors[skill.proficiency]
                    }`}
                  >
                    {skill.is_verified && (
                      <CheckCircle className="h-3 w-3" />
                    )}
                    <span>{skill.name}</span>
                    <span className="text-xs opacity-75">
                      ({skill.years_experience}y)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certifications */}
        {consultant.certification_items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {consultant.certification_items.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <Award className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {cert.name}
                        </h4>
                        {cert.is_verified && (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {cert.issuing_organization}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Issued {format(new Date(cert.issue_date), 'MMM yyyy')}
                        </span>
                        {cert.expiry_date && (
                          <span
                            className={
                              cert.is_expired ? 'text-destructive' : 'text-primary'
                            }
                          >
                            {cert.is_expired ? 'Expired' : 'Valid'}
                          </span>
                        )}
                      </div>
                      {cert.credential_url && (
                        <a
                          href={cert.credential_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline mt-1 inline-block"
                        >
                          View Credential
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio */}
        {consultant.portfolio_items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {consultant.portfolio_items.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    {/* Portfolio Image */}
                    {item.images.length > 0 ? (
                      <img
                        src={item.images.find((img) => img.is_primary)?.image || item.images[0].image}
                        alt={item.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}

                    {/* Portfolio Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {item.title}
                          </h4>
                          {item.category_name && (
                            <span className="text-xs text-gray-500">
                              {item.category_name}
                            </span>
                          )}
                        </div>
                        {item.is_featured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                        {item.description}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        {item.completion_date && (
                          <span>
                            Completed {format(new Date(item.completion_date), 'MMM yyyy')}
                          </span>
                        )}
                        {item.project_url && (
                          <a
                            href={item.project_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View Project
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews Link */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Reviews</h3>
                <p className="text-sm text-gray-600">
                  {consultant.total_reviews || 0} reviews with an average rating of{' '}
                  {(Number(consultant.rating) || 0).toFixed(1)} stars
                </p>
              </div>
              <Link href={`/reviews/consultant/${consultant.user_id}`}>
                <Button variant="outline">View All Reviews</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Invite Success Message */}
        {inviteSuccess && (
          <Alert className="bg-primary/5 border-primary/20">
            <CheckCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary">
              Invitation sent successfully! The consultant will receive your invitation.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && consultant && (
        <InviteConsultantModal
          consultantId={consultant.user_id}
          consultantName={consultant.full_name}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            setInviteSuccess(true);
            setTimeout(() => setInviteSuccess(false), 5000);
          }}
        />
      )}
    </DashboardLayout>
  );
}
