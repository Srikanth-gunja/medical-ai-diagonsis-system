import type { Metadata } from 'next';
import PatientDashboardClientLayout from './ClientLayout';

export const metadata: Metadata = {
    title: 'Patient Dashboard - MediCare',
    description: 'Manage your healthcare appointments, search for doctors, access medical records, and get AI-powered health assistance.',
};

export default function PatientDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <PatientDashboardClientLayout>{children}</PatientDashboardClientLayout>;
}
