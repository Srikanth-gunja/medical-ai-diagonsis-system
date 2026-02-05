import type { Metadata } from 'next';
import PatientDashboardInteractive from './components/PatientDashboardInteractive';

export const metadata: Metadata = {
  title: 'Patient Dashboard - MediCare',
  description:
    'Manage your healthcare appointments, view medical records, connect with doctors, and track your health journey all in one place.',
};

export default function PatientDashboardPage() {
  return <PatientDashboardInteractive />;
}
