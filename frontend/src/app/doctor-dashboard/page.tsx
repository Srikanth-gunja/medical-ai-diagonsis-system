import type { Metadata } from 'next';
import DoctorDashboardInteractive from './components/DoctorDashboardInteractive';

export const metadata: Metadata = {
    title: 'Doctor Dashboard - MediCare',
    description: 'Manage your medical practice with comprehensive appointment scheduling, patient management, prescription creation, and practice analytics in one centralized dashboard.',
};

export default function DoctorDashboardPage() {
    return <DoctorDashboardInteractive />;
}