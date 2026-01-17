'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavigationBreadcrumbs from '@/components/common/NavigationBreadcrumbs';
import AuthenticatedHeader from '@/components/common/AuthenticatedHeader';
import Icon from '@/components/ui/AppIcon';
import { doctorsApi, authApi, type Doctor } from '@/lib/api';

interface ProfileData {
  name: string;
  specialty: string;
  location: string;
  experience: number;
  image: string;
}

interface PendingUpdate {
  hasPendingUpdate: boolean;
  pendingData?: Partial<ProfileData>;
  requestedAt?: string;
}

export default function DoctorProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<Doctor | null>(null);
  const [pendingUpdate, setPendingUpdate] = useState<PendingUpdate>({ hasPendingUpdate: false });

  const [formData, setFormData] = useState<ProfileData>({
    name: '',
    specialty: '',
    location: '',
    experience: 0,
    image: '',
  });

  const specialtyOptions = [
    'General Practitioner',
    'Cardiologist',
    'Dermatologist',
    'Neurologist',
    'Orthopedic Surgeon',
    'Pediatrician',
    'Psychiatrist',
    'Gynecologist',
    'Ophthalmologist',
    'ENT Specialist',
    'Oncologist',
    'Urologist',
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await doctorsApi.getProfile();
      setDoctorProfile(data);
      setFormData({
        name: data.name || '',
        specialty: data.specialty || '',
        location: data.location || '',
        experience: data.experience || 0,
        image: data.image || '',
      });

      // Check for pending update
      try {
        const pendingData = await doctorsApi.getPendingUpdate();
        setPendingUpdate(pendingData);
      } catch (err) {
        // No pending update endpoint yet or no pending update
        setPendingUpdate({ hasPendingUpdate: false });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value;
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pendingUpdate.hasPendingUpdate) {
      setMessage({
        type: 'warning',
        text: 'You already have a pending profile update awaiting admin approval.',
      });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await doctorsApi.requestProfileUpdate(formData);
      setMessage({
        type: 'success',
        text: 'Profile update request submitted! Awaiting admin approval.',
      });
      setPendingUpdate({
        hasPendingUpdate: true,
        pendingData: formData,
        requestedAt: new Date().toISOString(),
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to submit profile update. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedHeader
        user={{
          name: doctorProfile?.name || 'Doctor',
          role: 'doctor',
          avatar:
            doctorProfile?.image || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d',
        }}
        notificationCount={0}
        onLogout={handleLogout}
      />

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <NavigationBreadcrumbs />

        <div className="max-w-3xl mx-auto">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Icon name="UserCircleIcon" size={28} className="text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Profile Settings</h1>
              <p className="text-text-secondary">Manage your professional information</p>
            </div>
          </div>

          {/* Pending Update Banner */}
          {pendingUpdate.hasPendingUpdate && (
            <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-start space-x-3">
                <Icon name="ClockIcon" size={24} className="text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-warning">Profile Update Pending</p>
                  <p className="text-sm text-text-secondary mt-1">
                    Your profile changes are awaiting admin approval. You cannot make new changes
                    until the current request is processed.
                  </p>
                  {pendingUpdate.requestedAt && (
                    <p className="text-xs text-text-tertiary mt-2">
                      Requested:{' '}
                      {new Date(pendingUpdate.requestedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
                message.type === 'success'
                  ? 'bg-success/10 border border-success/20'
                  : message.type === 'warning'
                    ? 'bg-warning/10 border border-warning/20'
                    : 'bg-error/10 border border-error/20'
              }`}
            >
              <Icon
                name={
                  message.type === 'success'
                    ? 'CheckCircleIcon'
                    : message.type === 'warning'
                      ? 'ExclamationTriangleIcon'
                      : 'ExclamationCircleIcon'
                }
                size={20}
                className={
                  message.type === 'success'
                    ? 'text-success'
                    : message.type === 'warning'
                      ? 'text-warning'
                      : 'text-error'
                }
              />
              <p
                className={
                  message.type === 'success'
                    ? 'text-success'
                    : message.type === 'warning'
                      ? 'text-warning'
                      : 'text-error'
                }
              >
                {message.text}
              </p>
            </div>
          )}

          {/* Current Profile Display */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-elevation-1">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
              <Icon name="IdentificationIcon" size={20} className="text-primary" />
              <span>Current Profile</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-text-secondary mb-1">Name</p>
                <p className="font-medium text-text-primary">{doctorProfile?.name || 'N/A'}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-text-secondary mb-1">Specialty</p>
                <p className="font-medium text-text-primary">{doctorProfile?.specialty || 'N/A'}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-text-secondary mb-1">Location</p>
                <p className="font-medium text-text-primary">{doctorProfile?.location || 'N/A'}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-text-secondary mb-1">Experience</p>
                <p className="font-medium text-text-primary">
                  {doctorProfile?.experience || 0} years
                </p>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-elevation-1"
          >
            <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center space-x-2">
              <Icon name="PencilSquareIcon" size={20} className="text-primary" />
              <span>Edit Profile</span>
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={pendingUpdate.hasPendingUpdate}
                  className="w-full h-12 px-4 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base disabled:bg-muted disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Specialty *
                </label>
                <select
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  disabled={pendingUpdate.hasPendingUpdate}
                  className="w-full h-12 px-4 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base disabled:bg-muted disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Select specialty</option>
                  {specialtyOptions.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={pendingUpdate.hasPendingUpdate}
                  placeholder="e.g., New York, NY"
                  className="w-full h-12 px-4 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base disabled:bg-muted disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  disabled={pendingUpdate.hasPendingUpdate}
                  min="0"
                  max="60"
                  className="w-full h-12 px-4 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base disabled:bg-muted disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Profile Image URL
                </label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  disabled={pendingUpdate.hasPendingUpdate}
                  placeholder="https://example.com/your-photo.jpg"
                  className="w-full h-12 px-4 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base disabled:bg-muted disabled:cursor-not-allowed"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Provide a URL to your professional photo
                </p>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-primary/5 rounded-lg p-4 mt-6">
              <div className="flex items-start space-x-3">
                <Icon name="InformationCircleIcon" size={20} className="text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-text-primary font-medium">Admin Approval Required</p>
                  <p className="text-sm text-text-secondary mt-1">
                    All profile changes require admin approval before being applied. This ensures
                    the accuracy of professional information displayed to patients.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <button
                type="button"
                onClick={() => router.push('/doctor-dashboard')}
                className="px-6 py-3 text-text-secondary hover:text-text-primary transition-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || pendingUpdate.hasPendingUpdate}
                className="px-8 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:shadow-elevation-2 disabled:opacity-50 disabled:cursor-not-allowed transition-base flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Icon name="PaperAirplaneIcon" size={20} />
                    <span>Submit for Approval</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
