import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Admin Dashboard - MediCare',
    description: 'Admin dashboard for managing doctors, patients, and platform statistics.',
};

export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
