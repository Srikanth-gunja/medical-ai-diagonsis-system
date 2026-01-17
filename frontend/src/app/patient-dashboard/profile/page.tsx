'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavigationBreadcrumbs from '@/components/common/NavigationBreadcrumbs';
import Icon from '@/components/ui/AppIcon';
import { patientsApi } from '@/lib/api';
import { useUser } from '../ClientLayout';

interface ProfileData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    dateOfBirth: string;
    gender: string;
    bloodGroup: string;
    city: string;
    state: string;
    zipCode: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    allergies: string;
    currentMedications: string;
    chronicConditions: string[];
    previousSurgeries: string;
    insuranceProvider: string;
    insurancePolicyNumber: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const { refreshUser } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeSection, setActiveSection] = useState('personal');

    const [formData, setFormData] = useState<ProfileData>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        gender: '',
        bloodGroup: '',
        city: '',
        state: '',
        zipCode: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        allergies: '',
        currentMedications: '',
        chronicConditions: [],
        previousSurgeries: '',
        insuranceProvider: '',
        insurancePolicyNumber: '',
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await patientsApi.getProfile();
            setFormData({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || '',
                phone: data.phone || '',
                address: data.address || '',
                dateOfBirth: (data as any).dateOfBirth || '',
                gender: (data as any).gender || '',
                bloodGroup: (data as any).bloodGroup || '',
                city: (data as any).city || '',
                state: (data as any).state || '',
                zipCode: (data as any).zipCode || '',
                emergencyContactName: (data as any).emergencyContactName || '',
                emergencyContactPhone: (data as any).emergencyContactPhone || '',
                allergies: (data as any).allergies || '',
                currentMedications: (data as any).currentMedications || '',
                chronicConditions: (data as any).chronicConditions || [],
                previousSurgeries: (data as any).previousSurgeries || '',
                insuranceProvider: (data as any).insuranceProvider || '',
                insurancePolicyNumber: (data as any).insurancePolicyNumber || '',
            });
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleConditionToggle = (condition: string) => {
        setFormData(prev => ({
            ...prev,
            chronicConditions: prev.chronicConditions.includes(condition)
                ? prev.chronicConditions.filter(c => c !== condition)
                : [...prev.chronicConditions, condition]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            await patientsApi.updateProfile(formData as any);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            await refreshUser();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    const sections = [
        { id: 'personal', label: 'Personal Info', icon: 'UserIcon' },
        { id: 'contact', label: 'Contact Details', icon: 'PhoneIcon' },
        { id: 'medical', label: 'Medical History', icon: 'HeartIcon' },
        { id: 'insurance', label: 'Insurance', icon: 'ShieldCheckIcon' },
    ];

    const chronicConditionOptions = [
        'Diabetes', 'Hypertension', 'Heart Disease', 'Asthma',
        'Arthritis', 'Cancer', 'COPD', 'Kidney Disease', 'None'
    ];

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 sm:px-6 py-8 flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8">
            <NavigationBreadcrumbs />

            <div className="max-w-4xl mx-auto">
                <div className="flex items-center space-x-3 mb-8">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Icon name="UserCircleIcon" size={28} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">Edit Profile</h1>
                        <p className="text-text-secondary">Manage your personal information and preferences</p>
                    </div>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${message.type === 'success'
                        ? 'bg-success/10 border border-success/20'
                        : 'bg-error/10 border border-error/20'
                        }`}>
                        <Icon
                            name={message.type === 'success' ? 'CheckCircleIcon' : 'ExclamationCircleIcon'}
                            size={20}
                            className={message.type === 'success' ? 'text-success' : 'text-error'}
                        />
                        <p className={message.type === 'success' ? 'text-success' : 'text-error'}>
                            {message.text}
                        </p>
                    </div>
                )}

                {/* Section Tabs */}
                <div className="flex flex-wrap gap-2 mb-6 border-b border-border pb-4">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            type="button"
                            onClick={() => setActiveSection(section.id)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-base ${activeSection === section.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-text-secondary hover:bg-muted/80'
                                }`}
                        >
                            <Icon name={section.icon as any} size={18} />
                            <span>{section.label}</span>
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-elevation-1">
                    {/* Personal Info Section */}
                    {activeSection === 'personal' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-text-primary mb-4">Personal Information</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">First Name *</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full h-12 px-4 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">Last Name *</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full h-12 px-4 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    className="w-full h-12 px-4 bg-muted border border-input rounded-lg text-text-secondary cursor-not-allowed"
                                    disabled
                                />
                                <p className="text-xs text-text-secondary mt-1">Email cannot be changed</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">Date of Birth</label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        className="w-full h-12 px-4 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">Gender</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full h-12 px-4 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                        <option value="prefer-not-to-say">Prefer not to say</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">Blood Group</label>
                                <select
                                    name="bloodGroup"
                                    value={formData.bloodGroup}
                                    onChange={handleChange}
                                    className="w-full h-12 px-4 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base"
                                >
                                    <option value="">Select blood group</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Contact Details Section */}
                    {activeSection === 'contact' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-text-primary mb-4">Contact Details</h2>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="212-555-0123"
                                    className="w-full h-12 px-4 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">Street Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="123 Main Street"
                                    className="w-full h-12 px-4 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="New York"
                                        className="w-full h-12 px-4 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">State</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        placeholder="NY"
                                        className="w-full h-12 px-4 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">ZIP Code</label>
                                    <input
                                        type="text"
                                        name="zipCode"
                                        value={formData.zipCode}
                                        onChange={handleChange}
                                        placeholder="10001"
                                        className="w-full h-12 px-4 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-border pt-6 mt-6">
                                <h3 className="text-lg font-medium text-text-primary mb-4">Emergency Contact</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-text-primary mb-2">Contact Name</label>
                                        <input
                                            type="text"
                                            name="emergencyContactName"
                                            value={formData.emergencyContactName}
                                            onChange={handleChange}
                                            placeholder="Jane Doe"
                                            className="w-full h-12 px-4 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-primary mb-2">Contact Phone</label>
                                        <input
                                            type="tel"
                                            name="emergencyContactPhone"
                                            value={formData.emergencyContactPhone}
                                            onChange={handleChange}
                                            placeholder="212-555-0124"
                                            className="w-full h-12 px-4 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Medical History Section */}
                    {activeSection === 'medical' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-text-primary mb-4">Medical History</h2>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">Allergies</label>
                                <textarea
                                    name="allergies"
                                    value={formData.allergies}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="List any allergies (medications, food, environmental)..."
                                    className="w-full px-4 py-3 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">Current Medications</label>
                                <textarea
                                    name="currentMedications"
                                    value={formData.currentMedications}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="List all current medications and dosages..."
                                    className="w-full px-4 py-3 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-3">Chronic Conditions</label>
                                <div className="flex flex-wrap gap-2">
                                    {chronicConditionOptions.map(condition => (
                                        <button
                                            key={condition}
                                            type="button"
                                            onClick={() => handleConditionToggle(condition)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-base ${formData.chronicConditions.includes(condition)
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-text-secondary hover:bg-muted/80'
                                                }`}
                                        >
                                            {condition}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">Previous Surgeries</label>
                                <textarea
                                    name="previousSurgeries"
                                    value={formData.previousSurgeries}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="List any previous surgeries with dates..."
                                    className="w-full px-4 py-3 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Insurance Section */}
                    {activeSection === 'insurance' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-text-primary mb-4">Insurance Information</h2>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">Insurance Provider</label>
                                <input
                                    type="text"
                                    name="insuranceProvider"
                                    value={formData.insuranceProvider}
                                    onChange={handleChange}
                                    placeholder="e.g., Blue Cross Blue Shield"
                                    className="w-full h-12 px-4 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">Policy Number</label>
                                <input
                                    type="text"
                                    name="insurancePolicyNumber"
                                    value={formData.insurancePolicyNumber}
                                    onChange={handleChange}
                                    placeholder="Policy/Member ID"
                                    className="w-full h-12 px-4 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base"
                                />
                            </div>

                            <div className="bg-muted/50 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <Icon name="InformationCircleIcon" size={20} className="text-primary mt-0.5" />
                                    <div>
                                        <p className="text-sm text-text-primary font-medium">Insurance Verification</p>
                                        <p className="text-sm text-text-secondary mt-1">
                                            Your insurance information will be verified before appointments.
                                            Please ensure your details are up to date.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 text-text-secondary hover:text-text-primary transition-base"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-8 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:shadow-elevation-2 disabled:opacity-50 disabled:cursor-not-allowed transition-base flex items-center space-x-2"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Icon name="CheckIcon" size={20} />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
