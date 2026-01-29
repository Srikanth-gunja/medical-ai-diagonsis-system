'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { getUser, getToken, API_BASE_URL } from '@/lib/api';

interface AdminStats {
  patients: { total: number };
  doctors: { total: number; verified: number; pending: number; rejected: number };
  appointments: { total: number; completed: number; pending: number };
  prescriptions: number;
  ratings: number;
}

interface Doctor {
  id: string;
  userId: string;
  name: string;
  email: string;
  specialty: string;
  location: string;
  verified: boolean;
  verificationStatus: string;
  image: string;
  pendingProfileUpdate?: Record<string, unknown>;
  pendingProfileUpdateAt?: string;
}

interface Patient {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}



export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'doctors' | 'patients' | 'profile-requests'
  >('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [profileRequests, setProfileRequests] = useState<Doctor[]>([]);
  const [doctorFilter, setDoctorFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>(
    'all'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'doctors') {
      fetchDoctors();
    } else if (activeTab === 'patients') {
      fetchPatients();
    } else if (activeTab === 'profile-requests') {
      fetchProfileRequests();
    }
  }, [activeTab, doctorFilter]);

  const fetchData = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
      // Also fetch profile requests count
      await fetchProfileRequests();
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = getToken();
      const url =
        doctorFilter === 'all'
          ? `${API_BASE_URL}/admin/doctors`
          : `${API_BASE_URL}/admin/doctors?status=${doctorFilter}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors);
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/admin/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    }
  };

  const fetchProfileRequests = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/admin/profile-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProfileRequests(data.doctors);
      }
    } catch (error) {
      console.error('Failed to fetch profile requests:', error);
    }
  };

  const verifyDoctor = async (doctorId: string) => {
    setActionLoading(doctorId);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/admin/doctors/${doctorId}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        await fetchDoctors();
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to verify doctor:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const rejectDoctor = async (doctorId: string) => {
    setActionLoading(doctorId);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/admin/doctors/${doctorId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Verification rejected by admin' }),
      });
      if (response.ok) {
        await fetchDoctors();
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to reject doctor:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteDoctor = async (doctorId: string, userId: string) => {
    if (!confirm('Are you sure you want to delete this doctor? This action cannot be undone.')) {
      return;
    }
    setActionLoading(doctorId);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        await fetchDoctors();
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to delete doctor:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const approveProfileUpdate = async (doctorId: string) => {
    setActionLoading(doctorId);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/admin/doctors/${doctorId}/approve-profile`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        await fetchProfileRequests();
        await fetchDoctors();
      }
    } catch (error) {
      console.error('Failed to approve profile update:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const rejectProfileUpdate = async (doctorId: string) => {
    setActionLoading(doctorId);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/admin/doctors/${doctorId}/reject-profile`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        await fetchProfileRequests();
      }
    } catch (error) {
      console.error('Failed to reject profile update:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Icon name="ShieldCheckIcon" variant="solid" size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary">Admin Dashboard</h1>
                <p className="text-xs text-text-secondary">MediCare Management</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-text-secondary hover:text-error transition-base"
            >
              <Icon name="ArrowRightOnRectangleIcon" size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg w-fit mb-8">
          {(['overview', 'doctors', 'patients', 'profile-requests'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md font-medium transition-base capitalize relative ${activeTab === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              {tab === 'profile-requests' ? 'Profile Requests' : tab}
              {tab === 'profile-requests' && profileRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-warning text-white text-xs rounded-full flex items-center justify-center">
                  {profileRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Icon name="UsersIcon" size={24} className="text-primary" />
                  </div>
                  <span className="text-2xl font-bold text-text-primary">
                    {stats.patients.total}
                  </span>
                </div>
                <h3 className="text-text-secondary font-medium">Total Patients</h3>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                    <Icon name="UserGroupIcon" size={24} className="text-accent" />
                  </div>
                  <span className="text-2xl font-bold text-text-primary">
                    {stats.doctors.total}
                  </span>
                </div>
                <h3 className="text-text-secondary font-medium">Total Doctors</h3>
                <p className="text-xs text-success mt-1">{stats.doctors.verified} verified</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                    <Icon name="ClockIcon" size={24} className="text-warning" />
                  </div>
                  <span className="text-2xl font-bold text-text-primary">
                    {stats.doctors.pending}
                  </span>
                </div>
                <h3 className="text-text-secondary font-medium">Pending Verifications</h3>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                    <Icon name="CalendarDaysIcon" size={24} className="text-success" />
                  </div>
                  <span className="text-2xl font-bold text-text-primary">
                    {stats.appointments.total}
                  </span>
                </div>
                <h3 className="text-text-secondary font-medium">Total Appointments</h3>
                <p className="text-xs text-success mt-1">
                  {stats.appointments.completed} completed
                </p>
              </div>
            </div>

            {/* Pending Verifications Alert */}
            {stats.doctors.pending > 0 && (
              <div className="bg-warning/10 border border-warning/20 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-warning/20 rounded-xl flex items-center justify-center">
                      <Icon name="ExclamationTriangleIcon" size={24} className="text-warning" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">
                        {stats.doctors.pending} Doctor{stats.doctors.pending > 1 ? 's' : ''}{' '}
                        Awaiting Verification
                      </h3>
                      <p className="text-text-secondary">
                        Review and approve new doctor registrations
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('doctors');
                      setDoctorFilter('pending');
                    }}
                    className="px-4 py-2 bg-warning text-white rounded-lg font-medium hover:bg-warning/90 transition-base"
                  >
                    Review Now
                  </button>
                </div>
              </div>
            )}

            {/* Profile Update Requests Alert */}
            {profileRequests.length > 0 && (
              <div className="bg-accent/10 border border-accent/20 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                      <Icon name="PencilSquareIcon" size={24} className="text-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">
                        {profileRequests.length} Profile Update Request
                        {profileRequests.length > 1 ? 's' : ''}
                      </h3>
                      <p className="text-text-secondary">
                        Review and approve doctor profile changes
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('profile-requests')}
                    className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-base"
                  >
                    Review Now
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Doctors Tab */}
        {activeTab === 'doctors' && (
          <div className="space-y-6">
            {/* Filter */}
            <div className="flex items-center space-x-2">
              {(['all', 'pending', 'verified', 'rejected'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDoctorFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-base capitalize ${doctorFilter === filter
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-text-secondary hover:text-text-primary'
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Doctors List */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">
                      Doctor
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">
                      Specialty
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">
                      Location
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">
                      Status
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-text-secondary">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {doctors.map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-muted/30 transition-base">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={doctor.image || 'https://via.placeholder.com/40'}
                            alt={doctor.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium text-text-primary">{doctor.name}</p>
                            <p className="text-sm text-text-secondary">{doctor.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{doctor.specialty}</td>
                      <td className="px-6 py-4 text-text-secondary">{doctor.location}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${doctor.verificationStatus === 'verified'
                              ? 'bg-success/10 text-success'
                              : doctor.verificationStatus === 'pending'
                                ? 'bg-warning/10 text-warning'
                                : 'bg-error/10 text-error'
                            }`}
                        >
                          {doctor.verificationStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          {doctor.verificationStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => verifyDoctor(doctor.id)}
                                disabled={actionLoading === doctor.id}
                                className="px-3 py-1.5 bg-success text-white text-sm rounded-lg hover:bg-success/90 disabled:opacity-50 transition-base"
                              >
                                {actionLoading === doctor.id ? 'Loading...' : 'Verify'}
                              </button>
                              <button
                                onClick={() => rejectDoctor(doctor.id)}
                                disabled={actionLoading === doctor.id}
                                className="px-3 py-1.5 bg-error text-white text-sm rounded-lg hover:bg-error/90 disabled:opacity-50 transition-base"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {doctor.verificationStatus === 'rejected' && (
                            <button
                              onClick={() => verifyDoctor(doctor.id)}
                              disabled={actionLoading === doctor.id}
                              className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-base"
                            >
                              Re-verify
                            </button>
                          )}
                          <button
                            onClick={() => deleteDoctor(doctor.id, doctor.userId)}
                            disabled={actionLoading === doctor.id}
                            className="px-3 py-1.5 bg-error/10 text-error text-sm rounded-lg hover:bg-error/20 disabled:opacity-50 transition-base"
                          >
                            <Icon name="TrashIcon" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {doctors.length === 0 && (
                <div className="p-12 text-center">
                  <Icon
                    name="UserGroupIcon"
                    size={48}
                    className="text-text-tertiary mx-auto mb-4"
                  />
                  <p className="text-text-secondary">No doctors found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">
                    Patient
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">
                    Email
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">
                    Phone
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-muted/30 transition-base">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Icon name="UserIcon" size={20} className="text-primary" />
                        </div>
                        <p className="font-medium text-text-primary">
                          {patient.firstName} {patient.lastName}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{patient.email}</td>
                    <td className="px-6 py-4 text-text-secondary">{patient.phone || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {patients.length === 0 && (
              <div className="p-12 text-center">
                <Icon name="UsersIcon" size={48} className="text-text-tertiary mx-auto mb-4" />
                <p className="text-text-secondary">No patients found</p>
              </div>
            )}
          </div>
        )}

        {/* Profile Requests Tab */}
        {activeTab === 'profile-requests' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-text-primary">
              Pending Profile Update Requests
            </h2>

            {profileRequests.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <Icon name="CheckCircleIcon" size={48} className="text-success mx-auto mb-4" />
                <p className="text-text-secondary">No pending profile update requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {profileRequests.map((doctor) => (
                  <div key={doctor.id} className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <img
                          src={doctor.image || 'https://via.placeholder.com/60'}
                          alt={doctor.name}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-semibold text-text-primary">{doctor.name}</h3>
                          <p className="text-sm text-text-secondary">{doctor.email}</p>
                          <p className="text-sm text-text-secondary">
                            {doctor.specialty} • {doctor.location}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => approveProfileUpdate(doctor.id)}
                          disabled={actionLoading === doctor.id}
                          className="px-4 py-2 bg-success text-white rounded-lg font-medium hover:bg-success/90 disabled:opacity-50 transition-base"
                        >
                          {actionLoading === doctor.id ? 'Loading...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => rejectProfileUpdate(doctor.id)}
                          disabled={actionLoading === doctor.id}
                          className="px-4 py-2 bg-error text-white rounded-lg font-medium hover:bg-error/90 disabled:opacity-50 transition-base"
                        >
                          Reject
                        </button>
                      </div>
                    </div>

                    {/* Show pending changes */}
                    {doctor.pendingProfileUpdate && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <h4 className="text-sm font-medium text-text-primary mb-3">
                          Requested Changes:
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          {Object.entries(doctor.pendingProfileUpdate).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-text-secondary capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </p>
                              <p className="text-text-primary font-medium">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
